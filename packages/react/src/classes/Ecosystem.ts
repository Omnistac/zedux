import { createStore } from '@zedux/core'
import { createContext } from 'react'
import { globalStore, removeEcosystem } from '../store'
import {
  AnyAtomBase,
  AnyAtomInstance,
  AnyAtomInstanceBase,
  AtomGettersBase,
  AtomInstanceStateType,
  AtomInstanceType,
  AtomParamsType,
  AtomSelectorOrConfig,
  AtomStateType,
  Cleanup,
  EcosystemConfig,
  EdgeFlag,
  GraphEdgeInfo,
  GraphViewRecursive,
  MaybeCleanup,
} from '../types'
import { EcosystemGraphNode, EMPTY_CONTEXT, is } from '../utils'
import { AtomBase } from './atoms/AtomBase'
import { Graph } from './Graph'
import { IdGenerator } from './IdGenerator'
import { AtomInstanceBase } from './instances/AtomInstanceBase'
import { Scheduler } from './Scheduler'
import { SelectorCache } from './SelectorCache'
import { Mod, ZeduxPlugin } from './ZeduxPlugin'

const defaultMods = Object.keys(ZeduxPlugin.actions).reduce((map, mod) => {
  map[mod as Mod] = 0
  return map
}, {} as Record<Mod, number>)

const mapOverrides = (overrides: AtomBase<any, any, any>[]) =>
  overrides.reduce((map, atom) => {
    map[atom.key] = atom
    return map
  }, {} as Record<string, AtomBase<any, any, any>>)

export const ecosystemContext = createContext('global')

export class Ecosystem<Context extends Record<string, any> | undefined = any>
  implements AtomGettersBase {
  public _destroyOnUnmount = false
  public _graph: Graph = new Graph(this)
  public hydration?: Record<string, any>
  public _idGenerator = new IdGenerator()
  public _instances: Record<string, AnyAtomInstance> = {}
  public _onReady: EcosystemConfig<Context>['onReady']
  public _reactContexts: Record<string, React.Context<any>> = {}
  public _refCount = 0
  public _scheduler: Scheduler = new Scheduler(this)
  public selectorCache: SelectorCache = new SelectorCache(this)
  public complexAtomParams: boolean
  public complexSelectorParams: boolean
  public consumeHydrations?: boolean
  public context: Context
  public defaultTtl?: number
  public ecosystemId: string
  public flags?: string[]
  public modsMessageBus = createStore() // use an empty store as a message bus
  public mods: Record<Mod, number> = { ...defaultMods }
  public overrides: Record<string, AnyAtomBase> = {}
  public ssr?: boolean
  private cleanup?: MaybeCleanup
  private isInitialized = false
  private plugins: { plugin: ZeduxPlugin; cleanup: Cleanup }[] = []

  constructor({
    complexAtomParams,
    complexSelectorParams,
    consumeHydrations,
    context,
    defaultTtl,
    destroyOnUnmount,
    flags,
    id,
    onReady,
    overrides,
    ssr,
  }: EcosystemConfig<Context>) {
    if (DEV && flags && !Array.isArray(flags)) {
      throw new TypeError(
        "Zedux: The Ecosystem's `flags` property must be an array of strings"
      )
    }
    if (DEV && overrides && !Array.isArray(overrides)) {
      throw new TypeError(
        "Zedux: The Ecosystem's `overrides` property must be an array of Atom objects"
      )
    }

    this.ecosystemId = id || this._idGenerator.generateEcosystemId()

    if (overrides) {
      this.setOverrides(overrides)
    }

    this.consumeHydrations = consumeHydrations
    this.flags = flags
    this.complexAtomParams = !!complexAtomParams
    this.complexSelectorParams = !!complexSelectorParams
    this.context = context as Context
    this.defaultTtl = defaultTtl ?? -1
    this.ssr = ssr
    this._destroyOnUnmount = !!destroyOnUnmount
    this._onReady = onReady
    this.isInitialized = true
    this.cleanup = onReady?.(this)
  }

  /**
   * Merge the passed atom overrides into the ecosystem's current list of
   * overrides. Force-destroys all atom instances currently in the ecosystem
   * that should now be overridden.
   *
   * This can't be used to remove overrides. Use `.setOverrides()` or
   * `.removeOverrides()` for that.
   */
  public addOverrides(overrides: AnyAtomBase[]) {
    this.overrides = {
      ...this.overrides,
      ...mapOverrides(overrides),
    }

    overrides.forEach(override => {
      const instances = this.inspectInstances(override)

      Object.values(instances).forEach(instance => instance.destroy(true))
    })
  }

  /**
   * Retrieve an object mapping atom instance keyHashes to their current values.
   * Uses the `dehydrate` atom config option when specified to transform state
   * to a serializable form.
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
   * string passed to `exclude` will exclude all instances whose keyHash
   * contains the string (case-insensitive)
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
   * string passed to `include` will include all instances whose keyHash
   * contains the string (case-insensitive)
   *
   * Exclude takes precedence over include
   */
  public dehydrate({
    exclude,
    excludeFlags,
    include,
    includeFlags,
  }: {
    exclude?: (AnyAtomBase | string)[]
    excludeFlags?: string[]
    include?: (AnyAtomBase | string)[]
    includeFlags?: string[]
  } = {}) {
    const instances = Object.values(this._instances).filter(instance => {
      if (
        exclude &&
        exclude.some(atomOrKey =>
          typeof atomOrKey === 'string'
            ? instance.keyHash.toLowerCase().includes(atomOrKey.toLowerCase())
            : instance.atom.key === atomOrKey.key
        )
      ) {
        return false
      }

      if (
        excludeFlags &&
        excludeFlags.some(flag => instance.atom.flags?.includes(flag))
      ) {
        return false
      }

      if (!include && !includeFlags) return true

      if (
        include &&
        include.some(atomOrKey =>
          typeof atomOrKey === 'string'
            ? instance.keyHash.toLowerCase().includes(atomOrKey.toLowerCase())
            : instance.atom.key === atomOrKey.key
        )
      ) {
        return true
      }

      if (
        includeFlags &&
        includeFlags.some(flag => instance.atom.flags?.includes(flag))
      ) {
        return true
      }

      return false
    })

    return Object.fromEntries(
      instances.map(instance => {
        const state = instance.store.getState()

        return [
          instance.keyHash,
          instance.atom.dehydrate ? instance.atom.dehydrate(state) : state,
        ]
      })
    )
  }

  /**
   * Destroy this ecosystem - destroy all this ecosystem's atom instances,
   * remove and clean up all plugins, and remove this ecosystem from the
   * zeduxGlobalStore.
   *
   * Destruction will bail out by default if this ecosystem is still being
   * provided via an <EcosystemProvider>. Pass `true` as the first parameter to
   * force destruction anyway.
   */
  public destroy(force?: boolean) {
    if (!force && this._refCount > 0) return

    this.wipe()

    // Check if this ecosystem has been destroyed already
    const ecosystem = globalStore.getState().ecosystems[this.ecosystemId]
    if (!ecosystem) return

    if (this.mods.ecosystemDestroyed) {
      this.modsMessageBus.dispatch(
        ZeduxPlugin.actions.ecosystemDestroyed({ ecosystem: this })
      )
    }

    this.plugins.forEach(({ cleanup }) => cleanup())
    this.plugins = []

    globalStore.dispatch(
      removeEcosystem({
        ecosystemId: this.ecosystemId,
      })
    )
  }

  public get<A extends AtomBase<any, [], any>>(atom: A): AtomStateType<A>

  public get<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomStateType<A>

  public get<AI extends AtomInstanceBase<any, [...any], any>>(
    instance: AI
  ): AtomInstanceStateType<AI>

  /**
   * Returns an atom instance's value. Creates the atom instance if it doesn't
   * exist yet. Doesn't register any graph dependencies.
   */
  public get<A extends AtomBase<any, [...any], any>>(
    atom: A | AtomInstanceBase<any, [...any], any>,
    params?: AtomParamsType<A>
  ) {
    if (is(atom, AtomInstanceBase)) {
      return (atom as AnyAtomInstanceBase).store.getState()
    }

    const instance = this.getInstance(
      atom as A,
      params as AtomParamsType<A>
    ) as AtomInstanceBase<any, any, any>

    return instance.store.getState()
  }

  public getInstance<A extends AtomBase<any, [], any>>(
    atom: A
  ): AtomInstanceType<A>

  public getInstance<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>,
    edgeInfo?: GraphEdgeInfo
  ): AtomInstanceType<A>

  public getInstance<AI extends AtomInstanceBase<any, any, any>>(
    instance: AI,
    params?: [],
    edgeInfo?: GraphEdgeInfo
  ): AI

  /**
   * Returns an atom instance. Creates the atom instance if it doesn't exist
   * yet. Doesn't register any graph dependencies.
   */
  public getInstance<A extends AtomBase<any, [...any], any>>(
    atom: A | AtomInstanceBase<any, [...any], any>,
    params?: AtomParamsType<A>
  ) {
    if (is(atom, AtomInstanceBase)) {
      return atom
    }

    const keyHash = (atom as A).getKeyHash(this, params)

    // try to find an existing instance
    const existingInstance = this._instances[keyHash]
    if (existingInstance) return existingInstance

    // create a new instance
    const resolvedAtom = this.resolveAtom(atom as A)
    this._graph.addNode(keyHash)

    const newInstance = resolvedAtom._createInstance(
      this,
      keyHash,
      (params || []) as AtomParamsType<A>
    )
    this._instances[keyHash] = newInstance

    return newInstance
  }

  /**
   * Hydrate the state of atoms in this ecosystem with an object mapping atom
   * instance keyHashes to their hydrated state. This object will usually be the
   * result of a call to `ecosystem.dehydrate()`.
   *
   * This is the key to SSR. The ecosystem's initial state can be dehydrated on
   * the server, sent to the client in serialized form, deserialized, and passed
   * to `ecosystem.hydrate()`. Every atom instance that evaluates after this
   * hydration can use `injectHydration()` to retrieve its hydrated state.
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
    this.hydration = { ...this.hydration, ...dehydratedState }

    if (config?.retroactive === false) return

    Object.entries(dehydratedState).forEach(([key, val]) => {
      const instance = this._instances[key]

      if (!instance) return

      instance.setState(
        instance.atom.hydrate ? instance.atom.hydrate(val) : val
      )

      if (this.consumeHydrations) {
        delete this.hydration?.[key]
      }
    })
  }

  public inspectGraph(view: 'bottom-up'): GraphViewRecursive
  public inspectGraph(
    view: 'flat'
  ): Record<
    string,
    {
      dependencies: { key: string; operation: string }[]
      dependents: { key: string; operation: string }[]
    }
  >
  public inspectGraph(view: 'top-down'): GraphViewRecursive

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
  public inspectGraph(view?: string) {
    if (view !== 'top-down' && view !== 'bottom-up') {
      const hash: Record<
        string,
        {
          dependencies: { key: string; operation: string }[]
          dependents: { key: string; operation: string }[]
        }
      > = {}

      Object.keys(this._graph.nodes).forEach(cacheKey => {
        const node = this._graph.nodes[cacheKey]

        hash[cacheKey] = {
          dependencies: Object.keys(node.dependencies).map(key => ({
            key,
            operation: this._graph.nodes[key].dependents[cacheKey].operation,
          })),
          dependents: Object.keys(node.dependents).map(key => ({
            key,
            operation: node.dependents[key].operation,
          })),
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

              return dependent.flags & EdgeFlag.External
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
   * Get an object of all atom instances in this ecosystem.
   *
   * Pass an atom or atom key string to only return instances whose keyHash
   * weakly matches the passed key.
   */
  public inspectInstances(atom?: AnyAtomBase | string) {
    const isAtom = (atom as AnyAtomBase)?.key
    const filterKey = isAtom ? (atom as AnyAtomBase)?.key : (atom as string)
    const hash: Record<string, AtomInstanceBase<any, any, any>> = {}

    Object.values(this._instances)
      .sort((a, b) => a.keyHash.localeCompare(b.keyHash))
      .forEach(instance => {
        if (
          filterKey &&
          (isAtom
            ? instance.atom.key !== filterKey
            : !instance.keyHash.toLowerCase().includes(filterKey))
        ) {
          return
        }

        hash[instance.keyHash] = instance
      })

    return hash
  }

  /**
   * Get an object mapping all atom instance keyHashes in this ecosystem to
   * their current values.
   *
   * Pass an atom or atom key string to only return instances whose keyHash
   * weakly matches the passed key.
   */
  public inspectInstanceValues(atom?: AnyAtomBase | string) {
    const hash = this.inspectInstances(atom)

    // We just created the object. Just mutate it.
    Object.keys(hash).forEach(key => {
      hash[key] = hash[key].store.getState()
    })

    return hash
  }

  /**
   * Add a ZeduxPlugin to this ecosystem. This ecosystem will subscribe to the
   * plugin's modStore, whose state can be changed to reactively update the mods
   * of this ecosystem.
   *
   * This method will also call the passed plugin's `.registerEcosystem` method,
   * allowing the plugin to subscribe to this ecosystem's modsMessageBus
   *
   * The plugin will remain part of this ecosystem until it is unregistered or
   * this ecosystem is destroyed. `.wipe()` and `.reset()` don't remove plugins.
   */
  public registerPlugin(plugin: ZeduxPlugin) {
    if (this.plugins.some(descriptor => descriptor.plugin === plugin)) return

    const subscription = plugin.modsStore.subscribe((newState, oldState) => {
      this.recalculateMods(newState, oldState)
    })

    const cleanupRegistration = plugin.registerEcosystem(this)
    const cleanup = () => {
      subscription.unsubscribe()
      if (cleanupRegistration) cleanupRegistration()
    }

    this.plugins.push({ plugin, cleanup })
    this.recalculateMods(plugin.modsStore.getState())
  }

  /**
   * Remove all passed atoms from this ecosystem's list of atom overrides. Does
   * nothing for passed atoms that aren't currently in the overrides list.
   *
   * Force destroys all instances of all removed atoms. This forced destruction
   * will cause dependents of those instances to recreate their dependency atom
   * instance without using an override.
   */
  public removeOverrides(overrides: (AnyAtomBase | string)[]) {
    this.overrides = mapOverrides(
      Object.values(this.overrides).filter(atom =>
        overrides.every(override => {
          const key = typeof override === 'string' ? override : override.key

          return key !== atom.key
        })
      )
    )

    overrides.forEach(override => {
      const instances = this.inspectInstances(override)

      Object.values(instances).forEach(instance => instance.destroy(true))
    })
  }

  /**
   * Destroys all atom instances in this ecosystem, runs the cleanup function
   * returned from `onReady` (if any), and calls `onReady` again to reinitialize
   * the ecosystem.
   */
  public reset(newContext?: Context) {
    this.wipe()

    const prevContext = this.context
    if (typeof newContext !== 'undefined') this.context = newContext

    this.cleanup = this._onReady?.(this, prevContext)
  }

  /**
   * Runs an AtomSelector statically - without registering any dependencies or
   * updating any caches. If we've already cached this exact selector+args
   * combo, returns the cached value without running the selector again
   */
  public select<T, Args extends any[]>(
    atomSelector: AtomSelectorOrConfig<T, Args>,
    ...args: Args
  ): T {
    const cache = this.selectorCache.weakGetCache(atomSelector, args)
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
  public setOverrides(newOverrides: AtomBase<any, any, any>[]) {
    const oldOverrides = this.overrides

    this.overrides = mapOverrides(newOverrides)

    if (!this.isInitialized) return

    newOverrides.forEach(atom => {
      const instances = this.inspectInstances(atom)

      Object.values(instances).forEach(instance => {
        instance.destroy(true)
      })
    })

    if (!oldOverrides) return

    Object.values(oldOverrides).forEach(atom => {
      const instances = this.inspectInstances(atom)

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
    this.recalculateMods(undefined, plugin.modsStore.getState())
  }

  /**
   * Get an atom instance value. Don't create the atom instance if it doesn't
   * exist. Don't register any graph dependencies.
   */
  public weakGet<A extends AtomBase<any, [], any>>(
    atom: A
  ): AtomStateType<A> | undefined

  public weakGet<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomStateType<A> | undefined

  public weakGet<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params?: AtomParamsType<A>
  ) {
    const instance = this.weakGetInstance(
      atom as A,
      params as AtomParamsType<A>
    ) as AtomInstanceBase<any, any, any>

    return instance?.store.getState()
  }

  /**
   * Get an atom instance. Don't create the atom instance if it doesn't exist.
   * Don't register any graph dependencies.
   */
  public weakGetInstance<A extends AtomBase<any, [], any>>(
    atom: A
  ): AtomInstanceType<A> | undefined

  public weakGetInstance<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomInstanceType<A> | undefined

  public weakGetInstance<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params?: AtomParamsType<A>
  ) {
    const keyHash = (atom as A).getKeyHash(this, params)

    // try to find an existing instance
    return this._instances[keyHash]
  }

  /**
   * Destroy all atom instances in this ecosystem. Also run the cleanup function
   * returned from the onReady callback (if any). Don't remove plugins or re-run
   * the onReady callback.
   *
   * Important! This method is mostly for internal use. You won't typically want
   * to call this method. Prefer `.reset()` which re-runs the onReady callback
   * after wiping the ecosystem, allowing onReady to re-initialize the ecosystem
   * - preloading atoms, registering plugins, configuring context, etc
   */
  public wipe() {
    // call cleanup function first so it can configure the ecosystem for cleanup
    if (this.cleanup) this.cleanup()

    // TODO: Delete nodes in an optimal order, starting with nodes with no
    // internal dependents. This is different from highest-weighted nodes since
    // static dependents don't affect weight. This should make sure no internal
    // nodes schedule unnecessary reevaaluations to recreate force-destroyed
    // instances
    Object.values(this._instances).forEach(instance => {
      instance.destroy(true)
    })

    this.hydration = undefined
    this.selectorCache.wipe()

    this._scheduler.wipe()
    this._scheduler.flush()

    if (this.mods.ecosystemWiped) {
      this.modsMessageBus.dispatch(
        ZeduxPlugin.actions.ecosystemWiped({ ecosystem: this })
      )
    }
  }

  // Should only be used internally
  public _decrementRefCount() {
    this._refCount--
    if (!this._destroyOnUnmount) return

    this.destroy() // only destroys if _refCount === 0
  }

  // Should only be used internally
  public _destroyAtomInstance(keyHash: string) {
    // try to destroy instance (if not destroyed - this fn is called as part of
    // that destruction process too)
    this._graph.removeNode(keyHash)

    delete this._instances[keyHash] // TODO: dispatch an action over globalStore for this mutation
  }

  // Should only be used internally
  public _getReactContext(atom: AnyAtomBase) {
    const existingContext = this._reactContexts[atom.key]

    if (existingContext) return existingContext

    const newContext = createContext(EMPTY_CONTEXT)
    this._reactContexts[atom.key] = newContext

    return newContext
  }

  // Should only be used internally
  public _incrementRefCount() {
    this._refCount++
  }

  private recalculateMods(
    newState?: Record<Mod, boolean>,
    oldState?: Record<Mod, boolean>
  ) {
    if (oldState) {
      Object.entries(oldState).forEach(([key, isModded]) => {
        if (isModded) this.mods[key as Mod]-- // fun fact, undefined-- is fine
      })
    }

    if (newState) {
      Object.entries(newState).forEach(([key, isModded]) => {
        if (isModded) this.mods[key as Mod]++
      })
    }
  }

  private resolveAtom<AtomType extends AnyAtomBase>(atom: AtomType) {
    const override = this.overrides?.[atom.key]
    const maybeOverriddenAtom = (override || atom) as AtomType

    // to turn off flag checking, just don't pass a `flags` prop
    if (this.flags) {
      const badFlag = maybeOverriddenAtom.flags?.find(
        flag => !this.flags?.includes(flag)
      )

      if (DEV && badFlag) {
        console.error(
          `Zedux: encountered unsafe atom "${atom.key}" with flag "${badFlag}". This atom should be overridden in the current environment.`
        )
      }
    }

    return maybeOverriddenAtom
  }
}
