import {
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomGenerics,
  NodeOf,
  ParamsOf,
  AtomSelectorConfig,
  AtomSelectorOrConfig,
  StateOf,
  Cleanup,
  DehydrationFilter,
  EcosystemConfig,
  GraphEdgeConfig,
  GraphViewRecursive,
  MaybeCleanup,
  NodeFilter,
  ParamlessTemplate,
  Selectable,
  SelectorGenerics,
  EventMap,
  None,
  InjectSignalConfig,
  MapEvents,
  SingleEventListener,
  CatchAllListener,
  EventEmitter,
  AnyNodeGenerics,
  ListenerConfig,
  EcosystemEvents,
  InternalEvaluationReason,
  GetNode,
  Job,
} from '../types/index'
import {
  External,
  compare,
  makeReasonsReadable,
  EventlessStatic,
  CHANGE,
  CYCLE,
  EDGE,
  ERROR,
  INVALIDATE,
  MUTATE,
  PROMISE_CHANGE,
  RESET_END,
  RUN_START,
  RESET_START,
  RUN_END,
  is,
  CATCH_ALL,
} from '../utils/general'
import {
  getNode,
  mapOverrides,
  schedulerPost,
  schedulerPre,
} from '../utils/ecosystem'
import {
  bufferEdge,
  finishBuffer,
  finishBufferWithEvent,
  getEvaluationContext,
} from '../utils/evaluationContext'
import { isListeningTo, parseOnArgs, sendEcosystemEvent } from '../utils/events'
import {
  getSelectorKey,
  getSelectorName,
  swapSelectorRefs,
} from '../utils/selectors'
import { GraphNode } from './GraphNode'
import { IdGenerator } from './IdGenerator'
import { SelectorInstance } from './SelectorInstance'
import { Signal } from './Signal'
import { AtomInstance } from './instances/AtomInstance'
import { AsyncScheduler } from './schedulers/AsyncScheduler'
import { SyncScheduler } from './schedulers/SyncScheduler'
import { AtomTemplateBase } from './templates/AtomTemplateBase'

export class Ecosystem<Context extends Record<string, any> | undefined = any>
  implements EventEmitter, Job
{
  public asyncScheduler = new AsyncScheduler(this)
  public atomDefaults?: EcosystemConfig['atomDefaults']
  public complexParams?: boolean
  public context: Context

  /**
   * @deprecated this is only here for compatibility with the old atom getters
   * pre-v2. The ecosystem's `.get` and `.getNode` now register reactive
   * dependencies and `.getOnce` and `.getNodeOnce` replace the old static
   * behavior of `.get` and `.getInstance`.
   *
   * The ecosystem itself is now passed everywhere we used to pass atom getters.
   * As such, you can delete usages of this property and use the ecosystem
   * directly:
   *
   * ```ts
   * mySelector = ({ ecosystem }: AtomGetters) => ... // before
   * mySelector = (ecosystem: Ecosystem) => ... // after
   * ```
   */
  public ecosystem = this

  public tags?: string[]
  public hydration?: Record<string, any>
  public id: string
  public onReady: EcosystemConfig<Context>['onReady']
  public overrides: Record<string, AnyAtomTemplate> = {}
  public ssr?: boolean
  public syncScheduler = new SyncScheduler(this)
  public _idGenerator = new IdGenerator()

  /**
   * event`C`ounts - counts notifiers for each event type
   */
  public C = {
    [CATCH_ALL]: 0,
    [CHANGE]: 0,
    [CYCLE]: 0,
    [EDGE]: 0,
    [ERROR]: 0,
    [INVALIDATE]: 0,
    [MUTATE]: 0,
    [PROMISE_CHANGE]: 0,
    [RESET_END]: 0,
    [RESET_START]: 0,
    [RUN_END]: 0,
    [RUN_START]: 0,
  }

  /**
   * event`L`isteners - the list of event listeners added via `ecosystem.on`
   */
  public L: ((reason: InternalEvaluationReason) => void)[] = []

  /**
   * get`S`copeValue - a function atoms can call (via the `inject` utility) to
   * retrieve provided values. If this is defined, we are currently in a scoped
   * context.
   *
   * E.g. in React, this is a thin wrapper around React's `use` utility.
   */
  public S:
    | (((ecosystem: Ecosystem, context: Record<string, any>) => any) & {
        /**
         * `t`ype - Scope providers can optionally specify this type. Zedux uses
         * this to detect when atoms are evaluating during React component
         * renders.
         */
        t?: string
      })
    | undefined = undefined

  /**
   * @see Job.T
   */
  public T = 3 as const

  /**
   * `b`aseKeys - map selectors (or selector config objects) to a base
   * selectorKey that can be used to predictably create selectorKey+params ids
   * to look up the cached selector instance in `this.n`odes.
   */
  public b = new WeakMap<AtomSelectorOrConfig, string>()

  /**
   * `f`inishBuffer - the currently-used `finishBuffer` implementation. We swap
   * this out for better perf when no `runEnd` listeners are registered
   */
  public f = finishBuffer

  /**
   * `n`odes - a flat map of every cached graph node (atom instance or selector)
   * keyed by id.
   */
  public n = new Map<string, GraphNode>()

  /**
   * `s`copesByAtom - tracks the "scope" (set of contexts) used by instances of
   * an atom, mapped by its template key. This is set the first time a scoped
   * atom instance of that template evaluates.
   *
   * This stores the context objects (e.g. React contexts or atom templates)
   * themselves, not any provided values of those contexts. Those have to be
   * looked up via these context object references in a scoped context.
   */
  public s: Record<string, Record<string, any>[]> | undefined = undefined

  /**
   * `w`hy - the list of events this ecosystem is passing to event listeners
   * next job run. The ecosystem only cares about the `.f`ullEventMap property.
   */
  public w: InternalEvaluationReason[] = []

  public _refCount = 0

  /**
   * Only for use by internal addon packages - lets us attach anything we want
   * to the ecosystem. For example, the React package uses this to store React
   * Context objects
   */
  public _storage: Record<string, any> = {}

  private cleanup?: MaybeCleanup
  private isInitialized = false

  constructor(config: EcosystemConfig<Context>) {
    if (DEV) {
      if (config.tags && !Array.isArray(config.tags)) {
        throw new TypeError(
          "Zedux: The Ecosystem's `tags` property must be an array of strings"
        )
      }

      if (config.overrides && !Array.isArray(config.overrides)) {
        throw new TypeError(
          "Zedux: The Ecosystem's `overrides` property must be an array of atom template objects"
        )
      }
    }

    Object.assign(this, config)

    this.id ||= this._idGenerator.generateId('es')

    if (config.overrides) {
      this.setOverrides(config.overrides)
    }

    this.context = (this as any).context
    this.isInitialized = true
    this.cleanup = config.onReady?.(this)
  }

  /**
   * Merge the passed atom overrides into the ecosystem's current list of
   * overrides. Force-destroys all atom instances currently in the ecosystem
   * that should now be overridden.
   *
   * This can't be used to remove overrides. Use `.setOverrides()` or
   * `.removeOverrides()` for that.
   */
  public addOverrides(overrides: AnyAtomTemplate[]) {
    this.overrides = {
      ...this.overrides,
      ...mapOverrides(overrides),
    }

    overrides.forEach(override => {
      const nodes = this.findAll(override)

      Object.values(nodes).forEach(node => node.destroy(true))
    })
  }

  /**
   * Batch all state updates that happen synchronously during the passed
   * callback's execution. Flush all updates when the passed callback completes.
   *
   * Has no effect if the scheduler is already running - updates are always
   * batched when the scheduler is running.
   */
  public batch<T = any>(callback: () => T) {
    const pre = schedulerPre(this)

    try {
      const result = callback()

      schedulerPost(this, pre)

      return result
    } catch (err) {
      // this duplication is more performant than using `finally`
      schedulerPost(this, pre)

      throw err
    }
  }

  /**
   * Retrieve an object mapping atom instance ids to their current values.
   *
   * Calls the `dehydrate` atom config option (on atoms that have one) to
   * transform state to a serializable form. Pass `transform: false` to prevent
   * this.
   *
   * Atoms can be excluded from dehydration by passing `exclude` and/or
   * `excludeTags` options:
   *
   * ```ts
   * myEcosystem.dehydrate({
   *   exclude: [myAtom, 'my-fuzzy-search-string'],
   *   excludeTags: ['no-ssr']
   * })
   * ```
   *
   * An atom passed to `exclude` will exclude all instances of that atom. A
   * string passed to `exclude` will exclude all instances whose id contains the
   * string (case-insensitive)
   *
   * You can dehydrate only a subset of all atoms by passing `include` and/or
   * `includeTags` options:
   *
   * ```ts
   * myEcosystem.dehydrate({
   *   include: [myAtom, 'my-fuzzy-search-string'],
   *   includeTags: ['ssr']
   * })
   * ```
   *
   * An atom passed to `include` will include all instances of that atom. A
   * string passed to `include` will include all instances whose id contains the
   * string (case-insensitive)
   *
   * Excludes takes precedence over includes.
   *
   * By default, dehydration will call any configured `dehydrate` atom config
   * options to transform atom instance state. Pass `{ transform: false }` to
   * prevent this.
   */
  public dehydrate(options: DehydrationFilter = {}) {
    return [...this.n.values()].reduce((obj, node) => {
      const dehydration = node.d(options)

      if (typeof dehydration !== 'undefined') obj[node.id] = dehydration

      return obj
    }, {} as Record<string, any>)
  }

  /**
   * Get an atom instance. Don't create the atom instance if it doesn't exist.
   * Don't register any graph dependencies.
   *
   * Tries to find an exact match, but falls back to doing a fuzzy search if no
   * exact match is found. Pass atom params (or an empty array if no params or
   * when passing a search string) for the second argument to disable fuzzy
   * search.
   */
  public find<
    G extends Pick<AtomGenerics, 'Node' | 'Params' | 'State' | 'Template'>
  >(
    template: G extends AtomGenerics
      ? AtomTemplateBase<G>
      : AtomSelectorOrConfig<G>,
    params: G['Params']
  ): G['Node'] | undefined

  public find<
    G extends Pick<AtomGenerics, 'Node' | 'State' | 'Template'> & { Params: [] }
  >(
    template: G extends AtomGenerics
      ? AtomTemplateBase<G>
      : AtomSelectorOrConfig<G>
  ): G['Node'] | undefined

  public find<
    G extends Pick<AtomGenerics, 'Node' | 'Params' | 'State' | 'Template'>
  >(
    template: ParamlessTemplate<
      G extends AtomGenerics ? AtomTemplateBase<G> : AtomSelectorOrConfig<G>
    >
  ): G['Node'] | undefined

  public find(searchStr: string, params?: []): GraphNode | undefined

  public find<G extends AtomGenerics>(
    template: AtomTemplateBase<G> | AtomSelectorOrConfig<G> | string,
    params?: G['Params']
  ) {
    const isString = typeof template === 'string'
    const isTemplate = is(template, AtomTemplateBase)

    if (!isString) {
      const id = isTemplate
        ? (template as AnyAtomTemplate).getInstanceId(this, params)
        : getSelectorKey(this, template as AtomSelectorOrConfig)

      // try to find an existing instance
      const instance = this.n.get(id)
      if (instance) return instance
    }

    // if params are passed, don't fuzzy search
    if (params) {
      return this.n.get(
        isString
          ? template
          : `${
              isTemplate
                ? (template as AnyAtomTemplate).key
                : getSelectorKey(this, template as AtomSelectorOrConfig)
            }-${this._idGenerator.hashParams(params, this.complexParams)}`
      )
    }

    const matches = this.findAll(template)

    return (
      (isString && matches[template]) ||
      (Object.values(matches)[0] as G['Node'] | undefined)
    )
  }

  /**
   * Get an object of all atom instances in this ecosystem keyed by their id.
   *
   * Pass an atom template to only find instances of that atom. Pass an atom key
   * string to only return instances whose id weakly matches the passed key.
   */
  public findAll(options?: NodeFilter) {
    const hash: Record<string, GraphNode> = {}

    // TODO: normalize filter options here, before passing to `node.f`ilter
    ;[...this.n.values()]
      .filter(node => node.f(options))
      .sort((a, b) => a.id.localeCompare(b.id))
      .forEach(node => {
        hash[node.id] = node
      })

    return hash
  }

  /**
   * Resolves the instance of a passed atom template or selector function or
   * config object. Returns the value of the resolved instance. Creates the atom
   * or selector instance if it doesn't exist yet.
   *
   * This is reactive! When called in reactive contexts, it will register a
   * dynamic graph edge on the node resolved by this call.
   *
   * Also accepts an existing atom, selector, or signal instance. In this case,
   * this is functionally equivalent to calling `.get()` directly on the passed
   * instance.
   */
  public get: {
    <A extends AnyAtomTemplate>(template: A, params: ParamsOf<A>): StateOf<A>
    <A extends AnyAtomTemplate<{ Params: [] }>>(template: A): StateOf<A>
    <A extends AnyAtomTemplate>(template: ParamlessTemplate<A>): StateOf<A>

    <N extends GraphNode>(node: N): StateOf<N>

    <S extends Selectable>(template: S, params: ParamsOf<S>): StateOf<S>
    <S extends Selectable<any, []>>(template: S): StateOf<S>
    <S extends Selectable>(template: ParamlessTemplate<S>): StateOf<S>
  } = <A extends AnyAtomTemplate>(
    atom: A | AnyAtomInstance,
    params?: ParamsOf<A>
  ) => getNode(this, atom, params as ParamsOf<A>).get()

  /**
   * Returns an atom instance. Creates the atom instance if it doesn't exist
   * yet.
   *
   * This is reactive! When called in reactive contexts, it will register a
   * static graph edge on the node resolved by this call.
   *
   * @deprecated use `getNode` instead. @see Ecosystem.getNode
   */
  public getInstance: {
    <A extends AnyAtomTemplate>(
      template: A,
      params: ParamsOf<A>,
      edgeConfig?: GraphEdgeConfig
    ): NodeOf<A>

    <A extends AnyAtomTemplate<{ Params: [] }>>(template: A): NodeOf<A>

    <A extends AnyAtomTemplate>(template: ParamlessTemplate<A>): NodeOf<A>

    <I extends AnyAtomInstance>(
      instance: I,
      params?: [],
      edgeConfig?: GraphEdgeConfig
    ): I
  } = <G extends AtomGenerics>(
    atom: AtomTemplateBase<G>,
    params?: G['Params'],
    edgeConfig?: GraphEdgeConfig
  ) => this.getNode(atom, params, edgeConfig)

  /**
   * Returns a graph node. The type is determined by the passed value.
   *
   * - An atom template returns an atom instance
   * - A selector function or selector config object returns a selector instance
   * - A custom template returns its configured instance
   * - An atom/selector/signal instance returns itself unless it's destroyed, in
   *   which case Zedux recreates a new node from the template and
   *   caches/returns that.
   *
   * If the template requires params, the second `params` argument is required.
   * It will be used to create the node if it doesn't exist yet or to find the
   * exact id of a cached node.
   *
   * This is reactive! When called in reactive contexts, it will register a
   * static graph edge on the node resolved by this call. To get a graph node
   * without registering dependencies, @see Ecosystem.getNodeOnce
   */
  public getNode: GetNode = <G extends AtomGenerics>(
    template: AtomTemplateBase<G> | GraphNode<G> | AtomSelectorOrConfig<G>,
    params?: G['Params'],
    edgeConfig?: GraphEdgeConfig
  ) => {
    const instance = getNode(this, template, params as G['Params'])

    // If getNode is called in a reactive context, track the required atom
    // instances so we can add graph edges for them. When called outside a
    // reactive context, getNode() is just an alias for ecosystem.getNode()
    getEvaluationContext().n &&
      bufferEdge(
        instance,
        edgeConfig?.op || 'getNode',
        edgeConfig?.f ?? EventlessStatic
      )

    return instance
  }

  /**
   * Returns a graph node. The type is determined by the passed value. @see
   * Ecosystem.getNode
   *
   * Unlike `.getNode`, this is static - it doesn't register graph dependencies
   * even when called in reactive contexts.
   */
  public getNodeOnce: GetNode = <G extends AtomGenerics>(
    template: AtomTemplateBase<G> | GraphNode<G> | AtomSelectorOrConfig<G>,
    params?: G['Params']
  ) => getNode(this, template, params)

  /**
   * Returns a graph node. The type is determined by the passed value. @see
   * Ecosystem.getNode
   *
   * Unlike `.getNode`, this is static - it doesn't register graph dependencies
   * even when called in reactive contexts.
   */
  public getOnce: GetNode = <G extends AtomGenerics>(
    template: AtomTemplateBase<G> | GraphNode<G> | AtomSelectorOrConfig<G>,
    params?: G['Params']
  ) => getNode(this, template, params).getOnce()

  /**
   * Get the fully qualified id for the given selector+params combo.
   *
   * TODO: convert this to handle hashing for all types, replacing
   * `_idGenerator.hashParams`.
   */
  public hash(selectorOrConfig: AtomSelectorOrConfig, args?: any[]) {
    const paramsHash = args?.length
      ? this._idGenerator.hashParams(args, this.complexParams)
      : ''

    const baseKey = getSelectorKey(this, selectorOrConfig)

    return paramsHash ? `${baseKey}-${paramsHash}` : baseKey
  }

  /**
   * Hydrate the state of atoms in this ecosystem with an object mapping atom
   * instance ids to their hydrated state. This object will usually be the
   * result of a call to `ecosystem.dehydrate()`.
   *
   * This is the key to SSR. The ecosystem's initial state can be dehydrated on
   * the server, sent to the client in serialized form, deserialized, and passed
   * to `ecosystem.hydrate()`. Every atom instance that evaluates after this
   * hydration can use the `hydrate` injectStore config option to retrieve its
   * hydrated state.
   *
   * Pass `retroactive: false` to prevent this call from updating the state of
   * all atom instances that have already been initialized with this new
   * hydration. Hydration is retroactive by default.
   *
   * ```ts
   * ecosystem.hydrate(dehydratedState, { retroactive: false })
   * ```
   */
  public hydrate(
    dehydratedState: Record<string, any>,
    config?: { retroactive?: boolean }
  ) {
    if (DEV && (!dehydratedState || typeof dehydratedState !== 'object')) {
      throw new TypeError('Zedux: Expected an object', {
        cause: dehydratedState,
      })
    }

    this.hydration = { ...this.hydration, ...dehydratedState }

    if (config?.retroactive === false) return

    Object.entries(dehydratedState).forEach(([id, val]) => {
      const node = this.n.get(id)

      if (!node) return

      node.h(val)

      // we know hydration is defined at this point
      delete (this.hydration as Record<string, any>)[id]
    })
  }

  public on<E extends keyof EcosystemEvents>(
    eventName: E,
    callback: SingleEventListener<
      AnyNodeGenerics<{ Events: EcosystemEvents }>,
      E
    >,
    config?: ListenerConfig
  ): Cleanup

  public on(
    callback: CatchAllListener<AnyNodeGenerics<{ Events: EcosystemEvents }>>,
    config?: ListenerConfig // unused in `ecosystem.on` - only here for interface compatibility
  ): Cleanup

  public on<E extends keyof EcosystemEvents>(
    eventNameOrCallback: E | ((eventMap: Partial<EcosystemEvents>) => void),
    callbackOrConfig?:
      | SingleEventListener<AnyNodeGenerics<{ Events: EcosystemEvents }>, E>
      | ListenerConfig,
    maybeConfig?: ListenerConfig // unused in `ecosystem.on` - only here for interface compatibility
  ): Cleanup

  /**
   * Register an ecosystem event listener. Pass an event name and a callback
   * that will be invoked every time that event fires.
   *
   * Accepts a catch-all listener - just omit the first event name argument. The
   * callback will receive the full event map every time any ecosystem event
   * fires.
   *
   * The last `config` param does nothing here. It's only accepted for type
   * compatibility with graph node `.on` methods.
   */
  public on<E extends keyof EcosystemEvents>(
    eventNameOrCallback: E | ((eventMap: Partial<EcosystemEvents>) => void),
    callbackOrConfig?:
      | SingleEventListener<AnyNodeGenerics<{ Events: EcosystemEvents }>, E>
      | ListenerConfig,
    maybeConfig?: ListenerConfig
  ): Cleanup {
    const [, eventName, notify] = parseOnArgs(
      eventNameOrCallback,
      callbackOrConfig,
      maybeConfig
    )

    if (!(eventName in this.C)) {
      throw new Error(
        `Zedux: Invalid event name "${eventName}". Expected one of ${Object.keys(
          this.C
        )}`
      )
    }

    this.L.push(notify)
    this.C[eventName as keyof typeof this.C]++

    // deoptimize the `finishBuffer` operation
    if (this.C[RUN_END] || this.C[CATCH_ALL]) {
      this.f = finishBufferWithEvent
    }

    return () => {
      const index = this.L.indexOf(notify)

      if (~index) {
        this.L.splice(index, 1)
        this.C[eventName as keyof typeof this.C]--
      }

      // reoptimize the `finishBuffer` operation
      if (!this.C[RUN_END] && !this.C[CATCH_ALL]) {
        this.f = finishBuffer
      }
    }
  }

  /**
   * Remove all passed atoms from this ecosystem's list of atom overrides. Does
   * nothing for passed atoms that aren't currently in the overrides list.
   *
   * Force destroys all instances of all removed atoms. This forced destruction
   * will cause observers of those instances to recreate their observed atom
   * instance without using an override.
   */
  public removeOverrides(overrides: (AnyAtomTemplate | string)[]) {
    this.overrides = mapOverrides(
      Object.values(this.overrides).filter(template =>
        overrides.every(override => {
          const key = typeof override === 'string' ? override : override.key

          return key !== template.key
        })
      )
    )

    overrides.forEach(override => {
      const instances = this.findAll(override)

      Object.values(instances).forEach(instance => instance.destroy(true))
    })
  }

  /**
   * Destroys all atom instances in this ecosystem, runs the cleanup function
   * returned from `onReady` (if any), and calls `onReady` again to reinitialize
   * the ecosystem.
   *
   * Does not remove hydrations, ecosystem event listeners, or overrides by
   * default. Pass the relevant option to also delete those:
   *
   * ```ts
   * // to reset everything:
   * ecosystem.reset({
   *   context: newContextObject, // replace `ecosystem.context` with this
   *   hydration: true, // remove all hydrations passed to `ecosystem.hydrate`
   *   listeners: true, // remove all listeners registered via `ecosystem.on`
   *   overrides: true, // remove all atom overrides
   * })
   * ```
   *
   * Fires the `resetStart` event before starting. Fires the `resetEnd` event
   * after all reset operations are done. These can be used in tandem to capture
   * and restore specific atoms/other nodes, overrides, hydrations, and/or event
   * listeners.
   */
  public reset(
    config: {
      context?: Context
      hydration?: boolean
      listeners?: boolean
      overrides?: boolean
    } = {}
  ) {
    if (isListeningTo(this, RESET_START)) {
      sendEcosystemEvent(this, {
        ...config,
        type: RESET_START,
      })
    }

    const { asyncScheduler, n, syncScheduler } = this

    // call cleanup function first so it can configure the ecosystem for cleanup
    this.cleanup?.()

    // prevent node destruction from flushing the scheduler
    const syncPre = syncScheduler.pre()
    const asyncPre = asyncScheduler.pre()

    // TODO: Delete nodes in an optimal order, starting with nodes with no
    // internal observers. This is different from highest-weighted nodes since
    // static observers don't affect weight. This should make sure no internal
    // nodes schedule unnecessary reevaaluations to recreate force-destroyed
    // nodes
    ;[...n.values()].forEach(node => {
      node.destroy(true)
    })

    this.b = new WeakMap() // TODO: is this necessary?
    this.s = undefined

    if (config?.hydration) this.hydration = undefined
    if (config?.overrides) this.setOverrides([])

    syncScheduler.wipe()
    asyncScheduler.wipe()

    syncScheduler.post(syncPre)
    asyncScheduler.post(asyncPre)

    const prevContext = this.context
    if (typeof config?.context !== 'undefined') this.context = config.context

    this.cleanup = this.onReady?.(this, prevContext)

    if (isListeningTo(this, RESET_END)) {
      // this job will be added to the syncScheduler. Flush it after
      sendEcosystemEvent(this, {
        ...config,
        type: RESET_END,
      })
      syncScheduler.flush()
    }

    if (config?.listeners) {
      this.L = []
      this.C = Object.fromEntries(
        Object.keys(this.C).map(key => [key, 0])
      ) as Ecosystem['C']
    }
  }

  /**
   * Gets the cached value of an AtomSelector. If the passed selector + args
   * combo has never been cached, this runs the selector and caches/returns the
   * result.
   *
   * This is reactive! When called in reactive contexts, it will register a
   * dynamic graph edge on the node resolved by this call.
   *
   * @deprecated use `get` instead. @see Ecosystem.get
   */
  public select = <S extends Selectable>(
    selectable: S,
    ...args: ParamsOf<S>
  ): StateOf<S> => this.get(selectable, args)

  /**
   * Completely replace this ecosystem's current list of atom overrides with a
   * new list.
   *
   * Force destroys all instances of all previously- and newly-overridden atoms.
   * This forced destruction will cause observers of those instances to recreate
   * their observed atom instance.
   */
  public setOverrides(newOverrides: AnyAtomTemplate[]) {
    const oldOverrides = this.overrides

    this.overrides = mapOverrides(newOverrides)

    if (!this.isInitialized) return

    newOverrides.forEach(atom => {
      const instances = this.findAll(atom)

      Object.values(instances).forEach(instance => {
        instance.destroy(true)
      })
    })

    Object.values(oldOverrides).forEach(atom => {
      const instances = this.findAll(atom)

      Object.values(instances).forEach(instance => {
        instance.destroy(true)
      })
    })
  }

  public signal<State, MappedEvents extends EventMap = None>(
    state: State,
    config?: Pick<InjectSignalConfig<MappedEvents>, 'events'>
  ) {
    const id = this._idGenerator.generateId('@signal')

    const signal = new Signal<{
      Events: MapEvents<MappedEvents>
      State: State
    }>(this, id, state, config?.events)

    this.n.set(id, signal)

    return signal
  }

  public viewGraph(view: 'bottom-up'): GraphViewRecursive
  public viewGraph(view?: 'flat'): Record<
    string,
    {
      observers: { key: string; operation: string }[]
      sources: { key: string; operation: string }[]
      weight: number
    }
  >
  public viewGraph(view: 'top-down'): GraphViewRecursive

  /**
   * Get the current graph of this ecosystem. There are 3 views:
   *
   * Flat (default). Returns an object with all graph nodes on the top layer,
   * each node pointing to its sources and observers. No nesting.
   *
   * Bottom-Up. Returns an object containing all the leaf nodes of the graph
   * (nodes that have no internal observers), each node containing an object of
   * its parent nodes, recursively.
   *
   * Top-Down. Returns an object containing all the root nodes of the graph
   * (nodes that have no sources), each node containing an object of its child
   * nodes, recursively.
   */
  public viewGraph(view?: string) {
    if (view !== 'top-down' && view !== 'bottom-up') {
      const hash: Record<
        string,
        {
          sources: { key: string; operation: string }[]
          observers: { key: string; operation: string }[]
          weight: number
        }
      > = {}

      for (const [id, node] of this.n) {
        hash[id] = {
          observers: [...node.o].map(([observer, edge]) => ({
            key: observer.id,
            operation: edge.operation,
          })),
          sources: [...node.s].map(([source, edge]) => ({
            key: source.id,
            operation: edge.operation,
          })),
          weight: node.W,
        }
      }

      return hash
    }

    const hash: GraphViewRecursive = {}

    for (const [key, node] of this.n) {
      const isTopLevel =
        view === 'bottom-up'
          ? [...node.o.values()].every(dependent => dependent.flags & External)
          : !node.s.size

      if (isTopLevel) {
        hash[key] = {}
      }
    }

    const recurse = (node?: GraphNode) => {
      if (!node) return

      const map = view === 'bottom-up' ? node.s : node.o
      const children: GraphViewRecursive = {}

      for (const key of map.keys()) {
        const child = recurse(typeof key === 'string' ? this.n.get(key) : key)

        if (child) children[typeof key === 'string' ? key : key.id] = child
      }

      return children
    }

    Object.keys(hash).forEach(key => {
      const node = this.n.get(key)
      const children = recurse(node)

      if (children) hash[key] = children
    })

    return hash
  }

  /**
   * Returns the list of reasons detailing why the current atom instance or
   * selector is evaluating.
   *
   * Returns undefined if nothing is currently evaluating. Returns an empty
   * array if this is the first evaluation of the instance or selector.
   */
  public why() {
    return makeReasonsReadable(getEvaluationContext().n)
  }

  /**
   * Run ecosystem operations in a scoped context. React components always
   * render in a scoped context, so you usually don't have to think about this.
   * Use this to retrieve scoped atoms outside React - scoped atoms (atoms with
   * `inject` calls) must run in a scoped context in order to be created or
   * indirectly retrieved.
   *
   * A "scope" is a group of contextual values. A "context" means two completely
   * different things:
   *
   * - a function's execution (this is what "scoped context" is referring to)
   * - a stable object reference, e.g. a React "context" object or an atom
   *   template returned from the `atom()` factory. When mapped to provided
   *   values, contexts create a scope.
   *
   * ```ts
   * const myScope = new Map([
   *   [myReactContext, myProvidedValue],
   *   [myAtom, ecosystem.getNode(myAtom)]
   * ])
   *
   * const myScopedNode = ecosystem.withScope(
   *   myScope,
   *   () => ecosystem.getNode(myScopedAtom)
   * )
   * ```
   *
   * Pass a scope and a callback function to run in that scope. The scope can be
   * either an array of atom instances or a JS Map mapping context objects (e.g.
   * React contexts or atom templates) to the provided values. The latter format
   * is required when providing React context.
   *
   * The values of the map can be WeakRefs. They'll be automatically deref'd.
   *
   * Scopes are recursive - nested `withScope` calls will recursively look for
   * context values in inner -> outer scopes.
   *
   * Returns the passed callback's result.
   */
  public withScope<T>(
    scope: AtomInstance[] | Map<Record<string, any>, any>,
    scopedCallback: () => T
  ) {
    const prev = this.S
    const map = Array.isArray(scope)
      ? new Map(scope.map(val => [val.t, val]))
      : scope

    this.S = (ecosystem, context) => {
      const value = map.get(context)
      const resolvedValue =
        value?.constructor?.name === WeakRef.name ? value.deref() : value

      return typeof resolvedValue === 'undefined'
        ? prev?.(ecosystem, context)
        : resolvedValue
    }

    try {
      const result = scopedCallback()

      return result
    } finally {
      this.S = prev
    }
  }

  /**
   * @see Job.j
   */
  public j() {
    for (const reason of this.w) {
      for (const listener of this.L) {
        listener(reason)
      }
    }

    this.w = []
  }

  /**
   * `u`pdateSelectorRef - swaps out the `t`emplate of a selector instance if
   * needed. Bails out if args have changed or the selector template ref hasn't
   * changed.
   *
   * This is used for "inline" selectors e.g. passed to `useAtomSelector`
   */
  public u<G extends SelectorGenerics>(
    instance: SelectorInstance<G>,
    template: G['Template'],
    params: G['Params'],
    ref: { m?: boolean }
  ) {
    const paramsUnchanged = (
      (template as AtomSelectorConfig).argsComparator || compare
    )(params, instance.p || ([] as unknown as G['Params']))

    const resolvedArgs = paramsUnchanged ? instance.p : params

    // if the refs/args don't match, instance has refCount: 1, there is no
    // cache yet for the new ref, and the new ref has the same name, assume it's
    // an inline selector and can be swapped
    const isSwappingRefs =
      instance.t !== template &&
      paramsUnchanged &&
      instance.o.size === 1 &&
      !this.b.has(template) &&
      getSelectorName(instance.t) === getSelectorName(template)

    if (isSwappingRefs) {
      // switch `m`ounted to false temporarily to prevent circular rerenders
      ref.m = false
      swapSelectorRefs(this, instance, template, resolvedArgs)
      ref.m = true
    }

    return isSwappingRefs
      ? instance
      : this.getNode(template, resolvedArgs as ParamsOf<G['Template']>)
  }
}
