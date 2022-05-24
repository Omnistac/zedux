import { createStore } from '@zedux/core'
import { createContext } from 'react'
import { addEcosystem, globalStore, removeEcosystem } from '../store'
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
  GraphEdgeInfo,
  MaybeCleanup,
} from '../types'
import { is } from '../utils'
import { Atom } from './atoms/Atom'
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
  public _idGenerator = new IdGenerator()
  public _instances: Record<string, AnyAtomInstance> = {}
  public _onReady: EcosystemConfig<Context>['onReady']
  public _refCount = 0
  public _scheduler: Scheduler = new Scheduler(this)
  public _selectorCache: SelectorCache = new SelectorCache(this)
  public allowComplexAtomParams: boolean
  public allowComplexSelectorParams: boolean
  public context: Context
  public defaultForwardPromises?: boolean
  public defaultTtl?: number
  public ecosystemId: string
  public flags?: string[] = []
  public modsMessageBus = createStore() // use an empty store as a message bus
  public mods: Record<Mod, number> = { ...defaultMods }
  public overrides: Record<string, AnyAtomBase> = {}
  private cleanup?: MaybeCleanup
  private destructionTimeout?: ReturnType<typeof setTimeout>
  private isInitialized = false
  private plugins: { plugin: ZeduxPlugin; cleanup: Cleanup }[] = []

  constructor({
    allowComplexAtomParams,
    allowComplexSelectorParams,
    context,
    defaultForwardPromises,
    defaultTtl,
    destroyOnUnmount,
    flags,
    id,
    onReady,
    overrides,
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

    if (flags) {
      this.flags = flags
    }

    this.allowComplexAtomParams = !!allowComplexAtomParams
    this.allowComplexSelectorParams = !!allowComplexSelectorParams
    this.context = context as Context
    this.defaultForwardPromises = defaultForwardPromises
    this.defaultTtl = defaultTtl ?? -1
    this._destroyOnUnmount = !!destroyOnUnmount
    this._onReady = onReady

    // yep. Dispatch this here. We'll make sure no component can ever be updated
    // synchronously from this call (causing update-during-render react warnings)
    globalStore.dispatch(addEcosystem(this))

    this.isInitialized = true
    this.cleanup = onReady?.(this)
  }

  public addOverrides(overrides: Atom<any, any, any>[]) {
    this.overrides = {
      ...this.overrides,
      ...mapOverrides(overrides),
    }

    overrides.forEach(override => {
      const instances = this.findInstances(override)
      instances.forEach(instance => instance._destroy(true))
    })
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
    if (this.destructionTimeout || (!force && this._refCount > 0)) return

    this.destructionTimeout = setTimeout(() => {
      this.destructionTimeout = undefined
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
    })
  }

  public findInstances(atom: AtomBase<any, any, any> | string) {
    const key = typeof atom === 'string' ? atom : atom.key

    return Object.values(this._instances).filter(
      instance => instance.atom.key === key
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

  public inspectInstanceValues(atom?: Atom<any, any[], any> | string) {
    const hash: Record<string, any> = {}
    const filterKey = typeof atom === 'string' ? atom : atom?.key

    Object.entries(this._instances)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, instance]) => {
        if (
          filterKey &&
          !instance.atom.key.includes(filterKey) &&
          !instance.keyHash.includes(filterKey)
        ) {
          return
        }

        hash[key] = instance.store.getState()
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
  public removeOverrides(overrides: (Atom<any, any, any> | string)[]) {
    this.overrides = mapOverrides(
      Object.values(this.overrides).filter(atom =>
        overrides.every(override => {
          const key = typeof override === 'string' ? override : override.key

          return key !== atom.key
        })
      )
    )

    overrides.forEach(override => {
      const instances = this.findInstances(override)

      instances.forEach(instance => instance._destroy(true))
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
    const cache = this._selectorCache.weakGetCache(atomSelector, args)
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
      const instances = this.findInstances(atom)

      instances.forEach(instance => {
        instance._destroy(true)
      })
    })

    if (!oldOverrides) return

    Object.values(oldOverrides).forEach(atom => {
      const instances = this.findInstances(atom)

      instances.forEach(instance => {
        instance._destroy(true)
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
      instance._destroy(true)
    })

    this._scheduler.wipe()
    this._scheduler.flush()

    if (this.mods.ecosystemWiped) {
      this.modsMessageBus.dispatch(
        ZeduxPlugin.actions.ecosystemWiped({ ecosystem: this })
      )
    }
  }

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

  public _incrementRefCount() {
    this._refCount++
    if (this._refCount === 1 && this.destructionTimeout) {
      clearTimeout(this.destructionTimeout)
    }
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
