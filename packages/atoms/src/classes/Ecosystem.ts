import { createStore, detailedTypeof, is, isPlainObject } from '@zedux/core'
import { internalStore } from '../store/index'
import {
  AnyAtomGenerics,
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomGenerics,
  AtomGetters,
  AtomGettersBase,
  AtomInstanceType,
  AtomParamsType,
  AtomSelectorConfig,
  AtomSelectorOrConfig,
  AtomStateType,
  Cleanup,
  DehydrationFilter,
  DependentEdge,
  EcosystemConfig,
  GraphEdgeDetails,
  GraphViewRecursive,
  MaybeCleanup,
  NodeFilter,
  ParamlessTemplate,
  PartialAtomInstance,
  Selectable,
  SelectorGenerics,
} from '../types/index'
import {
  External,
  haveDepsChanged,
  isZeduxNode,
  Static,
} from '../utils/general'
import { pluginActions } from '../utils/plugin-actions'
import { IdGenerator } from './IdGenerator'
import { Scheduler } from './Scheduler'
import { Mod, ZeduxPlugin } from './ZeduxPlugin'
import { AtomTemplate } from './templates/AtomTemplate'
import { GraphNode } from './GraphNode'
import { bufferEdge, getEvaluationContext } from '../utils/evaluationContext'
import {
  getSelectorKey,
  getSelectorName,
  runSelector,
  SelectorInstance,
  swapSelectorRefs,
} from './SelectorInstance'
import { AtomTemplateBase } from './templates/AtomTemplateBase'
import { AtomInstance } from './instances/AtomInstance'

const defaultMods = Object.keys(pluginActions).reduce((map, mod) => {
  map[mod as Mod] = 0
  return map
}, {} as Record<Mod, number>)

const mapOverrides = (overrides: AnyAtomTemplate[]) =>
  overrides.reduce((map, atom) => {
    map[atom.key] = atom
    return map
  }, {} as Record<string, AnyAtomTemplate>)

export class Ecosystem<Context extends Record<string, any> | undefined = any>
  implements AtomGettersBase
{
  public atomDefaults?: EcosystemConfig['atomDefaults']
  public complexParams?: boolean
  public context: Context
  public destroyOnUnmount?: boolean
  public flags?: string[]
  public getters: AtomGetters
  public hydration?: Record<string, any>
  public id: string
  public modBus = createStore() // use an empty store as a message bus
  public onReady: EcosystemConfig<Context>['onReady']
  public overrides: Record<string, AnyAtomTemplate> = {}
  public ssr?: boolean
  public _idGenerator = new IdGenerator()

  /**
   * `b`aseKeys - map selectors (or selector config objects) to a base
   * selectorKey that can be used to predictably create selectorKey+params ids
   * to look up the cached selector instance in `this.n`odes.
   */
  public b = new WeakMap<AtomSelectorOrConfig, string>()

  /**
   * `n`odes - a flat map of every cached graph node (atom instance or selector)
   * keyed by id.
   */
  public n = new Map<string, GraphNode>()
  public _mods: Record<Mod, number> = { ...defaultMods }
  public _refCount = 0
  public _scheduler: Scheduler = new Scheduler(this)

  /**
   * Only for use by internal addon packages - lets us attach anything we want
   * to the ecosystem. For example, the React package uses this to store React
   * Context objects
   */
  public _storage: Record<string, any> = {}

  private cleanup?: MaybeCleanup
  private isInitialized = false
  private plugins: { plugin: ZeduxPlugin; cleanup: Cleanup }[] = []

  constructor(config: EcosystemConfig<Context>) {
    if (DEV) {
      if (config.flags && !Array.isArray(config.flags)) {
        throw new TypeError(
          "Zedux: The Ecosystem's `flags` property must be an array of strings"
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

    const get: AtomGetters['get'] = <G extends AtomGenerics>(
      atom: AtomTemplateBase<G>,
      params?: G['Params']
    ) => {
      const instance = this.getNode(atom, params as G['Params'])
      const node = getEvaluationContext().n

      // If get is called in a reactive context, track the required atom
      // instances so we can add graph edges for them. When called outside a
      // reactive context, get() is just an alias for ecosystem.get()
      if (node) {
        bufferEdge(instance.id, 'get', 0)
      }

      return instance.get()
    }

    const getInstance: AtomGetters['getInstance'] = <G extends AtomGenerics>(
      atom: AtomTemplateBase<G>,
      params?: G['Params'],
      edgeInfo?: GraphEdgeDetails
    ) => {
      const instance = this.getNode(atom, params as G['Params'])
      const node = getEvaluationContext().n

      // If getInstance is called in a reactive context, track the required atom
      // instances so we can add graph edges for them. When called outside a
      // reactive context, getInstance() is just an alias for
      // ecosystem.getInstance()
      if (node) {
        bufferEdge(
          instance.id,
          edgeInfo?.op || 'getInstance',
          edgeInfo?.f ?? Static
        )
      }

      return instance
    }

    const select: AtomGetters['select'] = <
      G extends SelectorGenerics = {
        Params: any
        State: any
        Template: any
      }
    >(
      selectable: Selectable<G>,
      ...args: G['Params']
    ) => {
      const node = getEvaluationContext().n

      // when called outside a reactive context, select() is just an alias for
      // ecosystem.select()
      if (!node) return this.select(selectable, ...args)

      const instance = this.getNode(selectable, args)
      bufferEdge(instance.id, 'select', 0)

      return instance.v as G['State']
    }

    this.getters = {
      ecosystem: this,
      get,
      getInstance,
      select,
    }
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
    const scheduler = this._scheduler

    const prevIsRunning = scheduler._isRunning
    scheduler._isRunning = true
    const result = callback()
    scheduler._isRunning = prevIsRunning

    scheduler.flush()

    return result
  }

  /**
   * Retrieve an object mapping atom instance ids to their current values.
   *
   * Calls the `dehydrate` atom config option (on atoms that have one) to
   * transform state to a serializable form. Pass `transform: false` to prevent
   * this.
   *
   * Atoms can be excluded from dehydration by passing `exclude` and/or
   * `excludeFlags` options:
   *
   * ```ts
   * myEcosystem.dehydrate({
   *   exclude: [myAtom, 'my-fuzzy-search-string'],
   *   excludeFlags: ['no-ssr']
   * })
   * ```
   *
   * An atom passed to `exclude` will exclude all instances of that atom. A
   * string passed to `exclude` will exclude all instances whose id contains the
   * string (case-insensitive)
   *
   * You can dehydrate only a subset of all atoms by passing `include` and/or
   * `includeFlags` options:
   *
   * ```ts
   * myEcosystem.dehydrate({
   *   include: [myAtom, 'my-fuzzy-search-string'],
   *   includeFlags: ['ssr']
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
   * Destroy this ecosystem - destroy all this ecosystem's atom instances,
   * remove and clean up all plugins, and remove this ecosystem from the
   * internal store.
   *
   * Destruction will bail out by default if this ecosystem is still being
   * provided via an <EcosystemProvider>. Pass `true` as the first parameter to
   * force destruction anyway.
   */
  public destroy(force?: boolean) {
    if (!force && this._refCount > 0) return

    this.wipe()

    // Check if this ecosystem has been destroyed already
    const ecosystem = internalStore.getState()[this.id]
    if (!ecosystem) return

    this.plugins.forEach(({ cleanup }) => cleanup())
    this.plugins = []

    internalStore.setState(state => {
      const newState = { ...state }
      delete newState[this.id]

      return newState
    })
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

  public find<
    G extends Pick<AtomGenerics, 'Node' | 'State' | 'Template'> = any
  >(searchStr: string, params?: []): G['Node'] | undefined

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

  public get<A extends AnyAtomTemplate>(
    template: A,
    params: AtomParamsType<A>
  ): AtomStateType<A>

  public get<A extends AnyAtomTemplate<{ Params: [] }>>(
    template: A
  ): AtomStateType<A>

  public get<A extends AnyAtomTemplate>(
    template: ParamlessTemplate<A>
  ): AtomStateType<A>

  public get<I extends AnyAtomInstance>(instance: I): AtomStateType<I>

  /**
   * Returns an atom instance's value. Creates the atom instance if it doesn't
   * exist yet. Doesn't register any graph dependencies.
   */
  public get<A extends AnyAtomTemplate>(
    atom: A | AnyAtomInstance,
    params?: AtomParamsType<A>
  ) {
    if ((atom as GraphNode)[isZeduxNode]) {
      return (atom as GraphNode).get()
    }

    const instance = this.getInstance(
      atom as A,
      params as AtomParamsType<A>
    ) as AnyAtomInstance

    return instance.store.getState()
  }

  public getInstance<A extends AnyAtomTemplate>(
    template: A,
    params: AtomParamsType<A>,
    edgeInfo?: GraphEdgeDetails // only here for AtomGetters type compatibility
  ): AtomInstanceType<A>

  public getInstance<A extends AnyAtomTemplate<{ Params: [] }>>(
    template: A
  ): AtomInstanceType<A>

  public getInstance<A extends AnyAtomTemplate>(
    template: ParamlessTemplate<A>
  ): AtomInstanceType<A>

  public getInstance<I extends AnyAtomInstance>(
    instance: I,
    params?: [],
    edgeInfo?: GraphEdgeDetails // only here for AtomGetters type compatibility
  ): I

  /**
   * Returns an atom instance. Creates the atom instance if it doesn't exist
   * yet. Doesn't register any graph dependencies.
   *
   * TODO: deprecate this in favor of `this.getNode`
   */
  public getInstance<A extends AnyAtomTemplate>(
    atom: A | AnyAtomInstance,
    params?: AtomParamsType<A>
  ) {
    return this.getNode(atom, params)
  }

  // TODO: Dedupe these overloads
  // atoms
  public getNode<G extends AtomGenerics = AnyAtomGenerics>(
    templateOrInstance: AtomTemplateBase<G> | AtomInstance<G>,
    params: G['Params']
  ): G['Node']

  public getNode<G extends AtomGenerics = AnyAtomGenerics<{ Params: [] }>>(
    templateOrInstance: AtomTemplateBase<G> | AtomInstance<G>
  ): G['Node']

  public getNode<G extends AtomGenerics = AnyAtomGenerics>(
    template: ParamlessTemplate<AtomTemplateBase<G> | AtomInstance<G>>
  ): G['Node']

  public getNode<I extends AnyAtomInstance>(instance: I, params?: []): I

  // selectors
  public getNode<
    G extends SelectorGenerics = {
      Params: any
      State: any
      Template: any
    }
  >(selectable: Selectable<G>, params: G['Params']): SelectorInstance<G>

  public getNode<
    G extends SelectorGenerics = {
      Params: any
      State: any
      Template: any
    }
  >(selectable: Selectable<G>): SelectorInstance<G>

  public getNode<
    G extends SelectorGenerics = {
      Params: any
      State: any
      Template: any
    }
  >(selectable: ParamlessTemplate<Selectable<G>>): SelectorInstance<G>

  public getNode<I extends SelectorInstance>(instance: I, params?: []): I

  /**
   * Returns a graph node. The type is determined by the passed value.
   *
   * - An atom template returns an atom instance
   * - A signal template returns a signal instance
   * - A selector returns a selector instance
   * - A custom template returns its configured instance
   *
   * If the template requires params, the second `params` argument is required.
   * It will be used to create the node if it doesn't exist yet or to find the
   * exact id of a cached node.
   *
   * Doesn't register any graph dependencies.
   */
  public getNode<G extends AtomGenerics>(
    template:
      | AtomTemplateBase<G>
      | AtomInstance<G>
      | AtomSelectorOrConfig<G>
      | SelectorInstance<G>,
    params?: G['Params']
  ) {
    if (DEV) {
      if (typeof params !== 'undefined' && !Array.isArray(params)) {
        throw new TypeError(
          `Zedux: Expected atom params to be an array. Received ${detailedTypeof(
            params
          )}`
        )
      }
    }

    if (is(template, AtomTemplateBase)) {
      const id = (template as AtomTemplate).getInstanceId(this, params)

      // try to find an existing instance
      const instance = this.n.get(id) as AtomInstance

      if (instance) {
        if (this._mods.instanceReused) {
          this.modBus.dispatch(
            pluginActions.instanceReused({
              instance: instance as AtomInstance,
              template: template as AtomTemplate,
            })
          )
        }

        return instance
      }

      // create a new instance
      const newInstance = this.resolveAtom(
        template as AtomTemplate
      )._createInstance(this, id, (params || []) as G['Params'])

      this.n.set(id, newInstance)
      newInstance.i()

      return newInstance
    }

    if ((template as GraphNode)[isZeduxNode]) {
      // if the passed atom instance is Destroyed, get(/create) the
      // non-Destroyed instance
      return (template as AtomInstance).l === 'Destroyed'
        ? this.getNode(
            (template as AtomInstance).t,
            (template as AtomInstance).p
          )
        : template
    }

    if (
      typeof template === 'function' ||
      (template && (template as AtomSelectorConfig).selector)
    ) {
      const selectorOrConfig = template as AtomSelectorOrConfig<G>
      const id = this.hash(selectorOrConfig, params)
      let instance = this.n.get(id) as SelectorInstance<G>

      if (instance) return instance

      // create the instance; it doesn't exist yet
      instance = new SelectorInstance(this, id, selectorOrConfig, params || [])

      this.n.set(id, instance)
      runSelector(instance, true)

      return instance
    }

    if (DEV) {
      throw new TypeError(
        `Zedux: Expected a template or node. Received ${detailedTypeof(
          template
        )}`
      )
    }
  }

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
    if (DEV) {
      if (!isPlainObject(dehydratedState)) {
        throw new TypeError(
          'Zedux: ecosystem.hydrate() - first parameter must be a plain object'
        )
      }
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
   * Add a ZeduxPlugin to this ecosystem. This ecosystem will subscribe to the
   * plugin's modStore, whose state can be changed to reactively update the mods
   * of this ecosystem.
   *
   * This method will also call the passed plugin's `.registerEcosystem` method,
   * allowing the plugin to subscribe to this ecosystem's modBus
   *
   * The plugin will remain part of this ecosystem until it is unregistered or
   * this ecosystem is destroyed. `.wipe()` and `.reset()` don't remove plugins.
   * However, a plugin _can_ set the `ecosystemWiped` mod and react to those
   * events.
   */
  public registerPlugin(plugin: ZeduxPlugin) {
    if (this.plugins.some(descriptor => descriptor.plugin === plugin)) return

    const subscription = plugin.modStore.subscribe((newState, oldState) => {
      this.recalculateMods(newState, oldState)
    })

    const cleanupRegistration = plugin.registerEcosystem(this)
    const cleanup = () => {
      subscription.unsubscribe()
      if (cleanupRegistration) cleanupRegistration()
    }

    this.plugins.push({ cleanup, plugin })
    this.recalculateMods(plugin.modStore.getState())
  }

  /**
   * Remove all passed atoms from this ecosystem's list of atom overrides. Does
   * nothing for passed atoms that aren't currently in the overrides list.
   *
   * Force destroys all instances of all removed atoms. This forced destruction
   * will cause dependents of those instances to recreate their dependency atom
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
   * Note that this doesn't remove overrides or plugins but _does_ remove
   * hydrations. This is because you can remove overrides/plugins yourself if
   * needed, but there isn't currently a way to remove hydrations.
   */
  public reset(newContext?: Context) {
    this.wipe()

    const prevContext = this.context
    if (typeof newContext !== 'undefined') this.context = newContext

    this.cleanup = this.onReady?.(this, prevContext)
  }

  /**
   * Runs an AtomSelector statically - without registering any dependencies or
   * updating any caches. If we've already cached this exact selector + args
   * combo, returns the cached value without running the selector again
   *
   * TODO: Deprecate this, replace with `ecosystem.get()` and `ecosystem.run()`
   */
  public select<G extends SelectorGenerics>(
    selectable: Selectable<G>,
    ...args: G['Params']
  ): G['State'] {
    if (is(selectable, SelectorInstance)) {
      return (selectable as SelectorInstance<G>).v
    }

    const atomSelector = selectable as AtomSelectorOrConfig<G>
    const hash = this.hash(atomSelector, args)
    const instance = this.n.get(hash)

    if (instance) return (instance as SelectorInstance).v

    const resolvedSelector =
      typeof atomSelector === 'function' ? atomSelector : atomSelector.selector

    return resolvedSelector(
      {
        ecosystem: this,
        get: this.get.bind(this),
        getInstance: this.getInstance.bind(this),
        select: this.select.bind(this),
      },
      ...args
    )
  }

  /**
   * Completely replace this ecosystem's current list of atom overrides with a
   * new list.
   *
   * Force destroys all instances of all previously- and newly-overridden atoms.
   * This forced destruction will cause dependents of those instances to
   * recreate their dependency atom instance.
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
    const paramsChanged = (
      (template as AtomSelectorConfig).argsComparator || haveDepsChanged
    )(params, instance.p || ([] as unknown as G['Params']))

    const resolvedArgs = paramsChanged ? params : instance.p

    // if the refs/args don't match, instance has refCount: 1, there is no
    // cache yet for the new ref, and the new ref has the same name, assume it's
    // an inline selector
    const isSwappingRefs =
      instance.t !== template &&
      !paramsChanged &&
      this.n.get(instance.id)?.o.size === 1 &&
      !this.b.has(template) &&
      getSelectorName(instance.t) === getSelectorName(template)

    if (isSwappingRefs) {
      // switch `m`ounted to false temporarily to prevent circular rerenders
      ref.m = false
      swapSelectorRefs(this, instance, template, resolvedArgs)
      ref.m = true
    }

    return isSwappingRefs ? instance : this.getNode(template, resolvedArgs)
  }

  /**
   * Unregister a plugin registered in this ecosystem via `.registerPlugin()`
   */
  public unregisterPlugin(plugin: ZeduxPlugin) {
    const index = this.plugins.findIndex(
      descriptor => descriptor.plugin === plugin
    )
    if (index === -1) return

    this.plugins[index].cleanup()
    this.plugins.splice(index, 1)
    this.recalculateMods(undefined, plugin.modStore.getState())
  }

  public viewGraph(view: 'bottom-up'): GraphViewRecursive
  public viewGraph(view?: 'flat'): Record<
    string,
    {
      dependencies: { key: string; operation: string }[]
      dependents: { key: string; operation: string }[]
      weight: number
    }
  >
  public viewGraph(view: 'top-down'): GraphViewRecursive

  /**
   * Get the current graph of this ecosystem. There are 3 views:
   *
   * Flat (default). Returns an object with all graph nodes on the top layer,
   * each node pointing to its dependencies and dependents. No nesting.
   *
   * Bottom-Up. Returns an object containing all the leaf nodes of the graph
   * (nodes that have no internal dependents), each node containing an object of
   * its parent nodes, recursively.
   *
   * Top-Down. Returns an object containing all the root nodes of the graph
   * (nodes that have no dependencies), each node containing an object of its
   * child nodes, recursively.
   */
  public viewGraph(view?: string) {
    if (view !== 'top-down' && view !== 'bottom-up') {
      const hash: Record<
        string,
        {
          dependencies: { key: string; operation: string }[]
          dependents: { key: string; operation: string }[]
        }
      > = {}

      for (const [id, node] of this.n) {
        hash[id] = {
          dependencies: [...node.s.keys()].map(key => ({
            key,
            operation: (this.n.get(key)?.o.get(id) as DependentEdge).operation,
          })),
          dependents: [...node.o.keys()].map(key => ({
            key,
            operation: (node.o.get(key) as DependentEdge).operation,
          })),
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
        const child = recurse(this.n.get(key))

        if (child) children[key] = child
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
    return getEvaluationContext().n?.w
  }

  /**
   * Destroy all atom instances in this ecosystem. Also run the cleanup function
   * returned from the onReady callback (if any). Don't remove plugins or re-run
   * the onReady callback.
   *
   * Also don't remove overrides. This may usually be wanted, but it's easy
   * enough to add a `.setOverrides([])` call when you need it.
   *
   * Important! This method is mostly for internal use. You won't typically want
   * to call this method. Prefer `.reset()` which re-runs the onReady callback
   * after wiping the ecosystem, allowing onReady to re-initialize the ecosystem
   * - preloading atoms, registering plugins, configuring context, etc
   */
  public wipe() {
    const { n, _mods, _scheduler, modBus } = this

    // call cleanup function first so it can configure the ecosystem for cleanup
    this.cleanup?.()

    // TODO: Delete nodes in an optimal order, starting with nodes with no
    // internal dependents. This is different from highest-weighted nodes since
    // static dependents don't affect weight. This should make sure no internal
    // nodes schedule unnecessary reevaaluations to recreate force-destroyed
    // nodes
    ;[...n.values()].forEach(node => {
      node.destroy(true)
    })

    this.b = new WeakMap() // TODO: is this necessary?
    this.hydration = undefined

    _scheduler.wipe()
    _scheduler.flush()

    if (_mods.ecosystemWiped) {
      modBus.dispatch(pluginActions.ecosystemWiped({ ecosystem: this }))
    }
  }

  /**
   * Should only be used internally
   */
  public _consumeHydration(instance: PartialAtomInstance) {
    const hydratedValue = this.hydration?.[instance.id]

    if (typeof hydratedValue === 'undefined') return

    // hydration must exist here. This cast is fine:
    delete (this.hydration as Record<string, any>)[instance.id]

    return instance.t.hydrate
      ? instance.t.hydrate(hydratedValue)
      : hydratedValue
  }

  /**
   * Should only be used internally
   */
  public _decrementRefCount() {
    this._refCount--
    if (!this.destroyOnUnmount) return

    this.destroy() // only destroys if _refCount === 0
  }

  /**
   * Should only be used internally
   */
  public _incrementRefCount() {
    this._refCount++
  }

  private recalculateMods(newState?: Mod[], oldState?: Mod[]) {
    if (oldState) {
      oldState.forEach(key => {
        this._mods[key as Mod]-- // fun fact, undefined-- is fine
      })
    }

    if (newState) {
      newState.forEach(key => {
        this._mods[key as Mod]++
      })
    }
  }

  private resolveAtom<A extends AnyAtomTemplate>(template: A) {
    const { flags, overrides } = this
    const override = overrides[template.key]
    const maybeOverriddenAtom = (override || template) as A

    // to turn off flag checking, just don't pass a `flags` prop
    if (flags) {
      const badFlag = maybeOverriddenAtom.flags?.find(
        flag => !flags.includes(flag)
      )

      if (DEV && badFlag) {
        console.error(
          `Zedux: encountered unsafe atom template "${template.key}" with flag "${badFlag}". This atom template should be overridden in the current environment.`
        )
      }
    }

    return maybeOverriddenAtom
  }
}
