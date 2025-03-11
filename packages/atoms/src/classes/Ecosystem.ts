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
  NodeType,
} from '../types/index'
import {
  CATCH_ALL,
  CHANGE,
  compare,
  CYCLE,
  EDGE,
  ERROR,
  EventlessStatic,
  External,
  INVALIDATE,
  is,
  makeReasonsReadable,
  MUTATE,
  PROMISE_CHANGE,
  RESET_END,
  RESET_START,
  RUN_END,
  RUN_START,
} from '../utils/general'
import {
  getNode,
  mapOverrides,
  mapRefToId,
  schedulerPost,
  schedulerPre,
} from '../utils/ecosystem'
import {
  bufferEdge,
  finishBuffer,
  finishBufferWithEvent,
  getEvaluationContext,
  startBuffer,
  startBufferWithEvent,
} from '../utils/evaluationContext'
import { isListeningTo, parseOnArgs, sendEcosystemEvent } from '../utils/events'
import {
  getSelectorKey,
  getSelectorName,
  swapSelectorRefs,
} from '../utils/selectors'
import { GraphNode } from './GraphNode'
import { SelectorInstance } from './SelectorInstance'
import { Signal } from './Signal'
import { AtomInstance } from './instances/AtomInstance'
import { AsyncScheduler } from './schedulers/AsyncScheduler'
import { SyncScheduler } from './schedulers/SyncScheduler'
import { AtomTemplateBase } from './templates/AtomTemplateBase'
import { handleStateChange, handleStateChangeWithEvent } from '../utils/graph'

export class Ecosystem<Context extends Record<string, any> | undefined = any>
  implements EventEmitter, Job
{
  public asyncScheduler = new AsyncScheduler(this)
  public atomDefaults: EcosystemConfig['atomDefaults'] | undefined = undefined
  public complexParams = false

  // @ts-expect-error context can be specifically undefined, and that's its type
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

  public hydration?: Record<string, any>
  public id: string | undefined = undefined
  public idCounter = 0
  public onReady: EcosystemConfig<Context>['onReady']
  public overrides: Record<string, AnyAtomTemplate> = {}
  public ssr = false
  public syncScheduler = new SyncScheduler(this)
  public tags: string[] | undefined = undefined

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
   * `c`urrent `f`inishBuffer - the currently-used `finishBuffer`
   * implementation. We swap this out for better perf when no `runEnd` ecosystem
   * event listeners are registered.
   */
  public cf = finishBuffer

  /**
   * `c`urrent `h`andleStateChange - the currently-used `handleStateChange`
   * implementation. We swap this out for better perf when no `change` ecosystem
   * event listeners are registered.
   */
  public ch = handleStateChange

  /**
   * `c`urrent `s`tartBuffer - the currently-used `startBuffer` implementation.
   * We swap this out for better perf when no `runStart` ecosystem event
   * listeners are registered.
   */
  public cs = startBuffer

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
   * `w`hy - the list of events this ecosystem is passing to event listeners on
   * the next job run. This is a singly-linked list. The ecosystem only cares
   * about the `.f`ullEventMap property.
   */
  public w: InternalEvaluationReason | undefined = undefined

  /**
   * `w`hy `t`ail - the last reason in the `w`hy linked list.
   */
  public wt: InternalEvaluationReason | undefined = undefined

  /**
   * Only for use by internal addon packages - lets us attach anything we want
   * to the ecosystem. For example, the React package uses this to store React
   * Context objects
   */
  public _storage: Record<string, any> = {}

  private cleanup?: MaybeCleanup

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

    if (config.overrides) {
      this.setOverrides(config.overrides, false)
    }

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

    for (const override of overrides) {
      for (const node of this.findAll(override)) {
        node.destroy(true)
      }
    }
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

  public dehydrate(options?: NodeType): Record<string, unknown>
  public dehydrate(options?: DehydrationFilter): Record<string, unknown>

  /**
   * Retrieve an object mapping atom instance ids to their current values.
   *
   * Accepts a single filter/config argument. Pass an `@`-prefixed string to
   * only dehydrate a certain type of node (e.g. `@atom`, `@selector`,
   * `@signal`).
   *
   * ```ts
   * // the most common:
   * const dehydration = myEcosystem.dehydrate('@atom')
   * ```
   *
   * Pass any string to fuzzy search for nodes that match the passed string.
   *
   * Pass any atom template to dehydrate all instances of that template.
   *
   * For full control, pass an object with optional `include`, `includeTags`,
   * `exclude`, `excludeTags`, and `transform` fields.
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
    }, {} as Record<string, unknown>)
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
            }-${this.hash(params)}`
      )
    }

    const matches = this.findAll(template)

    return (
      (isString && matches.find(match => match.id === template)) ||
      (Object.values(matches)[0] as G['Node'] | undefined)
    )
  }

  public findAll(type?: NodeType): GraphNode[]
  public findAll(options?: NodeFilter): GraphNode[]

  /**
   * Get a list of all atom instances in this ecosystem.
   *
   * Pass an `@`-prefixed string to only find certain types of node (e.g.
   * `@atom`, `@component`, `@selector`, `@signal`).
   *
   * Pass an atom template to only find instances of that atom. Pass an atom key
   * string to only return instances whose id weakly matches the passed key.
   *
   * @see Ecosystem.dehydrate
   *
   * Too much to remember? Just call `.findAll()` with no arguments and filter
   * the result yourself.
   */
  public findAll(options?: NodeFilter) {
    return [...this.n.values()]
      .filter(node => node.f(options))
      .sort((a, b) => a.id.localeCompare(b.id))
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
   * Turn an array of anything into a predictable string. If any item is an atom
   * instance, it will be serialized as the instance's id. If
   * `acceptComplexParams` is true, map class instances and functions to a
   * consistent id for the reference.
   *
   * Note that circular object references are not supported - they would add way
   * too much overhead here and are really just unnecessary.
   */
  public hash(params: any[], acceptComplexParams = this.complexParams) {
    return JSON.stringify(params, (_, param) => {
      if (!param) return param
      if (param.izn) return (param as GraphNode).id

      // if the prototype has no prototype, it's likely not a plain object:
      if (Object.getPrototypeOf(param.constructor.prototype)) {
        if (!acceptComplexParams || Array.isArray(param)) return param
        if (typeof param === 'function') {
          return mapRefToId(this, param, param.name)
        }
        if (typeof param === 'object')
          return mapRefToId(this, param, param.constructor.name)

        return param // let engine try to resolve it or throw the error
      }

      return Object.keys(param)
        .sort()
        .reduce((result, key) => {
          result[key] = param[key]
          return result
        }, {} as Record<string, any>)
    })
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

  /**
   * Generate a consistent id that is guaranteed to be unique in this ecosystem,
   * but not at all guaranteed to be unique globally.
   *
   * You can override this! Mutate this directly on an existing ecosystem or
   * pass the `makeId` option to `createEcosystem`. The default implementation
   * is suitable for most use cases, including:
   *
   * - apps that use only one ecosystem (the most common).
   * - snapshot testing the ecosystem graph and dehydrations.
   *
   * You may want to override this when using multiple ecosystems. Or to
   * customize ids to your liking (for example, prefixing atoms with `@atom()`
   * to match all other node types).
   *
   * Every node type but atoms has an `@` prefix. If a Zedux id is not
   * `@`-prefixed, it's an atom instance. The full list of built-in prefixes is:
   *
   * - `@component()-` An external node created via a React hook call. Wraps the
   *   component's name inside the `()`.
   *
   * - `@listener()-` A `GraphNode#on` call. Wraps the listened node's template
   *   key inside the `()`.
   *
   * - `@memo()-` An atom selector created via an `injectMemo` call with no
   *   deps. Wraps the containing atom's template key inside the `()`.
   *
   * - `@ref()-` A function or class instance reference tracked when the
   *   ecosystem is configured with `complexParams: true`. Wraps the function or
   *   class name inside the `()`.
   *
   * - `@selector()-` An atom selector. Wraps the selector's name inside the
   *   `()`.
   *
   * - `@signal()-` A signal created via `ecosystem.signal` or `injectSignal` or
   *   a mapped signal created via `injectMappedSignal`. Wraps the containing
   *   atom's template key inside the `()` (empty if created via
   *   `ecosystem.signal`)
   */
  public makeId(
    nodeType:
      | 'atom'
      | 'component'
      | 'listener'
      | 'memo'
      | 'ref'
      | 'selector'
      | 'signal',
    context?: GraphNode | string,
    suffix: number | string = `-${++this.idCounter}`
  ) {
    return nodeType === 'atom'
      ? (context as string)
      : `@${nodeType}(${(context as GraphNode)?.id ?? context ?? ''})${suffix}`
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
    const hasCatchAll = this.C[CATCH_ALL]

    // deoptimize the `finishBuffer` operation
    if (this.C[RUN_END] || hasCatchAll) {
      this.cf = finishBufferWithEvent
    }

    // deoptimize the `handleStateChange` operation
    if (this.C[CHANGE] || hasCatchAll) {
      this.ch = handleStateChangeWithEvent
    }

    // deoptimize the `startBuffer` operation
    if (this.C[RUN_START] || hasCatchAll) {
      this.cs = startBufferWithEvent
    }

    return () => {
      const index = this.L.indexOf(notify)

      if (~index) {
        this.L.splice(index, 1)
        this.C[eventName as keyof typeof this.C]--
      }

      const noCatchAll = !this.C[CATCH_ALL]

      // reoptimize the `finishBuffer` operation
      if (!this.C[RUN_END] && noCatchAll) {
        this.cf = finishBuffer
      }

      // reoptimize the `handleStateChange` operation
      if (!this.C[CHANGE] && noCatchAll) {
        this.ch = handleStateChange
      }

      // reoptimize the `startBuffer` operation
      if (!this.C[RUN_START] && noCatchAll) {
        this.cs = startBuffer
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

    for (const override of overrides) {
      for (const instance of this.findAll(override)) {
        instance.destroy(true)
      }
    }
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

    this.idCounter = 0
    this.cleanup = this.onReady?.(this, prevContext)

    if (isListeningTo(this, RESET_END)) {
      // this job will be added to the syncScheduler. Flush it after resetting
      // listeners
      sendEcosystemEvent(this, {
        ...config,
        type: RESET_END,
      })
    }

    if (config?.listeners) {
      this.L = []
      this.C = Object.fromEntries(
        Object.keys(this.C).map(key => [key, 0])
      ) as Ecosystem['C']
    }

    // flush the resetEnd event last
    syncScheduler.flush()
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
  public setOverrides(newOverrides: AnyAtomTemplate[], retroactive = true) {
    const oldOverrides = this.overrides

    this.overrides = mapOverrides(newOverrides)

    if (!retroactive) return

    for (const template of newOverrides) {
      for (const instance of this.findAll(template)) {
        instance.destroy(true)
      }
    }

    for (const template of Object.values(oldOverrides)) {
      for (const instance of this.findAll(template)) {
        instance.destroy(true)
      }
    }
  }

  public signal<State, MappedEvents extends EventMap = None>(
    state: State,
    config?: Pick<InjectSignalConfig<MappedEvents>, 'events'>
  ) {
    const id = this.makeId('signal')

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
    const isSingleEvent = this.w === this.wt
    let reason: InternalEvaluationReason | undefined = this.w!

    do {
      for (const listener of this.L) {
        listener(isSingleEvent ? reason : reason.r!)
      }
    } while ((reason = reason?.l))

    this.w = this.wt = undefined
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
