import { createStore, is, isPlainObject } from '@zedux/core'
import { internalStore } from '../store/index'
import {
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomGettersBase,
  AtomInstanceType,
  AtomParamsType,
  AtomSelectorOrConfig,
  AtomStateType,
  Cleanup,
  EcosystemConfig,
  EcosystemGraphNode,
  GraphEdgeInfo,
  GraphViewRecursive,
  MaybeCleanup,
  ParamlessTemplate,
  PartialAtomInstance,
  Selectable,
} from '../types/index'
import { External } from '../utils/index'
import { pluginActions } from '../utils/plugin-actions'
import { EvaluationStack } from './EvaluationStack'
import { Graph } from './Graph'
import { IdGenerator } from './IdGenerator'
import { AtomInstanceBase } from './instances/AtomInstanceBase'
import { Scheduler } from './Scheduler'
import { SelectorCache, Selectors } from './Selectors'
import { Mod, ZeduxPlugin } from './ZeduxPlugin'

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
  public hydration?: Record<string, any>
  public id: string
  public modBus = createStore() // use an empty store as a message bus
  public onReady: EcosystemConfig<Context>['onReady']
  public overrides: Record<string, AnyAtomTemplate> = {}
  public selectors: Selectors = new Selectors(this)
  public ssr?: boolean

  public _graph: Graph = new Graph(this)

  // define this after _graph so it can access _graph immediately
  public _evaluationStack: EvaluationStack = new EvaluationStack(this)
  public _idGenerator = new IdGenerator()
  public _instances: Record<string, AnyAtomInstance> = {}
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
      const instances = this.findAll(override)

      Object.values(instances).forEach(instance => instance.destroy(true))
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
  public dehydrate({
    exclude,
    excludeFlags,
    include,
    includeFlags,
    transform = true,
  }: {
    exclude?: (AnyAtomTemplate | string)[]
    excludeFlags?: string[]
    include?: (AnyAtomTemplate | string)[]
    includeFlags?: string[]
    transform?: boolean
  } = {}) {
    const instances = Object.values(this._instances).filter(
      ({ id, template }) => {
        if (
          exclude &&
          exclude.some(atomOrKey =>
            typeof atomOrKey === 'string'
              ? id.toLowerCase().includes(atomOrKey.toLowerCase())
              : template.key === atomOrKey.key
          )
        ) {
          return false
        }

        if (
          excludeFlags &&
          excludeFlags.some(flag => template.flags?.includes(flag))
        ) {
          return false
        }

        if (!include && !includeFlags) return true

        if (
          include &&
          include.some(atomOrKey =>
            typeof atomOrKey === 'string'
              ? id.toLowerCase().includes(atomOrKey.toLowerCase())
              : template.key === atomOrKey.key
          )
        ) {
          return true
        }

        if (
          includeFlags &&
          includeFlags.some(flag => template.flags?.includes(flag))
        ) {
          return true
        }

        return false
      }
    )

    return instances.reduce((obj, { id, store, template }) => {
      const state = store.getState()

      obj[id] =
        transform && template.dehydrate ? template.dehydrate(state) : state

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
   */
  public find<A extends AnyAtomTemplate>(
    template: A,
    params: AtomParamsType<A>
  ): AtomInstanceType<A> | undefined

  public find<A extends AnyAtomTemplate<{ Params: [] }>>(
    template: A
  ): AtomInstanceType<A> | undefined

  public find<A extends AnyAtomTemplate>(
    template: ParamlessTemplate<A>
  ): AtomInstanceType<A> | undefined

  public find<A extends AnyAtomTemplate = any>(
    key: string
  ): AtomInstanceType<A> | undefined

  public find<A extends AnyAtomTemplate>(
    template: A | string,
    params?: AtomParamsType<A>
  ) {
    if (typeof template !== 'string') {
      const id = (template as A).getInstanceId(this, params)

      // try to find an existing instance
      return this._instances[id]
    }

    return Object.values(this.findAll(template))[0] as
      | AtomInstanceType<A>
      | undefined
  }

  /**
   * Get an object of all atom instances in this ecosystem.
   *
   * Pass an atom template or atom template key string to only return instances
   * whose id weakly matches the passed key.
   */
  public findAll(template?: AnyAtomTemplate | string) {
    const isAtom = (template as AnyAtomTemplate)?.key
    const filterKey = isAtom
      ? (template as AnyAtomTemplate).key
      : (template as string)
    const hash: Record<string, AnyAtomInstance> = {}

    Object.values(this._instances)
      .sort((a, b) => a.id.localeCompare(b.id))
      .forEach(instance => {
        if (
          filterKey &&
          (isAtom
            ? instance.template.key !== filterKey
            : !instance.id.toLowerCase().includes(filterKey))
        ) {
          return
        }

        hash[instance.id] = instance
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
    if (is(atom, AtomInstanceBase)) {
      return (atom as AnyAtomInstance).store.getState()
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
    edgeInfo?: GraphEdgeInfo
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
    edgeInfo?: GraphEdgeInfo
  ): I

  /**
   * Returns an atom instance. Creates the atom instance if it doesn't exist
   * yet. Doesn't register any graph dependencies.
   */
  public getInstance<A extends AnyAtomTemplate>(
    atom: A | AnyAtomInstance,
    params?: AtomParamsType<A>
  ) {
    if (is(atom, AtomInstanceBase)) {
      // if the passed atom instance is Destroyed, get(/create) the
      // non-Destroyed instance
      return (atom as AnyAtomInstance).status === 'Destroyed'
        ? this.getInstance(
            (atom as AnyAtomInstance).template,
            (atom as AnyAtomInstance).params
          )
        : atom
    }

    const id = (atom as A).getInstanceId(this, params)

    // try to find an existing instance
    const instance = this._instances[id]
    if (instance) {
      if (this._mods.instanceReused) {
        this.modBus.dispatch(
          pluginActions.instanceReused({ instance, template: atom as A })
        )
      }

      return instance
    }

    // create a new instance
    const resolvedAtom = this.resolveAtom(atom as A)
    this._graph.addNode(id)

    const newInstance = resolvedAtom._createInstance(
      this,
      id,
      (params || []) as AtomParamsType<A>
    )
    this._instances[id] = newInstance
    newInstance._init()

    return newInstance
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

    Object.entries(dehydratedState).forEach(([key, val]) => {
      const instance = this._instances[key]

      if (!instance) return

      instance.setState(
        instance.template.hydrate ? instance.template.hydrate(val) : val
      )

      // we know hydration is defined at this point
      delete (this.hydration as Record<string, any>)[key]
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
   */
  public select<T, Args extends any[]>(
    selectable: Selectable<T, Args>,
    ...args: Args
  ): T {
    if (is(selectable, SelectorCache)) {
      return (selectable as SelectorCache<T, Args>).result as T
    }

    const atomSelector = selectable as AtomSelectorOrConfig<T, Args>
    const cache = this.selectors.find(atomSelector, args)
    if (cache) return cache.result as T

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
          weight: number
        }
      > = {}

      Object.keys(this._graph.nodes).forEach(id => {
        const node = this._graph.nodes[id]

        hash[id] = {
          dependencies: Object.keys(node.dependencies).map(key => ({
            key,
            operation: this._graph.nodes[key].dependents[id].operation,
          })),
          dependents: Object.keys(node.dependents).map(key => ({
            key,
            operation: node.dependents[key].operation,
          })),
          weight: node.weight,
        }
      })

      return hash
    }

    const hash: GraphViewRecursive = {}

    Object.keys(this._graph.nodes).forEach(key => {
      const node = this._graph.nodes[key]
      const isTopLevel =
        view === 'bottom-up'
          ? Object.keys(node.dependents).every(key => {
              const dependent = node.dependents[key]

              return dependent.flags & External
            })
          : !Object.keys(node.dependencies).length

      if (isTopLevel) {
        hash[key] = {}
      }
    })

    const recurse = (node?: EcosystemGraphNode) => {
      if (!node) return

      const keys = Object.keys(
        view === 'bottom-up' ? node.dependencies : node.dependents
      )
      const children: GraphViewRecursive = {}

      keys.forEach(key => {
        const child = recurse(this._graph.nodes[key])

        if (child) children[key] = child
      })

      return children
    }

    Object.keys(hash).forEach(key => {
      const node = this._graph.nodes[key]
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
    return this._evaluationStack.read()?.node.nextReasons
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
    const { _instances, _mods, _scheduler, modBus, selectors } = this

    // call cleanup function first so it can configure the ecosystem for cleanup
    this.cleanup?.()

    // TODO: Delete nodes in an optimal order, starting with nodes with no
    // internal dependents. This is different from highest-weighted nodes since
    // static dependents don't affect weight. This should make sure no internal
    // nodes schedule unnecessary reevaaluations to recreate force-destroyed
    // instances
    Object.values(_instances).forEach(instance => {
      instance.destroy(true)
    })

    this.hydration = undefined
    selectors._wipe()

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

    return instance.template.hydrate
      ? instance.template.hydrate(hydratedValue)
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
  public _destroyAtomInstance(id: string) {
    // try to destroy instance (if not destroyed - this fn is called as part of
    // that destruction process too)
    this._graph.removeNode(id)

    // mods have already been notified of the instance's status changing to
    // Destroyed by this point. No need to notify anything of this mutation.
    delete this._instances[id]
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
