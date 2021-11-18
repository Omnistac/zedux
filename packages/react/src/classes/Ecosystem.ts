import { Selector } from '@zedux/core'
import { DEV } from '@zedux/core/utils/general'
import { createContext } from 'react'
import { addEcosystem, globalStore, removeEcosystem } from '../store'
import {
  AnyAtomInstance,
  AnyAtomInstanceBase,
  AtomInstanceStateType,
  AtomInstanceType,
  AtomParamsType,
  AtomSelectorOrConfig,
  AtomStateType,
  EcosystemConfig,
  ZeduxPlugin,
} from '../types'
import { generateEcosystemId, is } from '../utils'
import { AtomInstance } from './AtomInstance'
import { Atom } from './atoms/Atom'
import { AtomBase } from './atoms/AtomBase'
import { Graph } from './Graph'
import { AtomInstanceBase } from './instances/AtomInstanceBase'
import { Scheduler } from './Scheduler'

const mapOverrides = (overrides: AtomBase<any, any, any>[]) =>
  overrides.reduce((map, atom) => {
    map[atom.key] = atom
    return map
  }, {} as Record<string, AtomBase<any, any, any>>)

export const ecosystemContext = createContext('global')

export class Ecosystem<Context extends Record<string, any> | undefined = any> {
  public _destroyOnUnmount = false
  public _graph: Graph = new Graph(this)
  public _instances: Record<string, AtomInstance<any, any[], any>> = {}
  public _preload: EcosystemConfig['preload']
  public _refCount = 0
  public _scheduler: Scheduler = new Scheduler(this)
  public context?: Context
  public defaultForwardPromises?: boolean
  public defaultTtl?: number
  public ecosystemId: string
  public flags?: string[] = []
  public ghostTtlMs: number
  public mods?: Partial<ZeduxPlugin>
  public overrides: Record<string, AtomBase<any, any[], any>> = {}
  private cleanup?: () => void
  private isInitialized = false
  private plugins: ZeduxPlugin[] = []

  constructor({
    context,
    defaultForwardPromises,
    defaultTtl,
    destroyOnUnmount,
    ghostTtlMs,
    flags,
    id,
    overrides,
    preload,
  }: EcosystemConfig<Context>) {
    if (flags && !Array.isArray(flags)) {
      throw new TypeError(
        "Zedux: The Ecosystem's `flags` property must be an array of strings"
      )
    }
    if (overrides && !Array.isArray(overrides)) {
      throw new TypeError(
        "Zedux: The Ecosystem's `overrides` property must be an array of Atom objects"
      )
    }

    this.ecosystemId = id || generateEcosystemId()

    if (overrides) {
      this.setOverrides(overrides)
    }

    if (flags) {
      this.flags = flags
    }

    this.context = context
    this.defaultForwardPromises = defaultForwardPromises
    this.defaultTtl = defaultTtl ?? -1
    this.ghostTtlMs = ghostTtlMs ?? 2000
    this._destroyOnUnmount = !!destroyOnUnmount
    this._preload = preload

    // yep. Dispatch this here. We'll make sure no component can ever be updated
    // synchronously from this call (causing update-during-render react warnings)
    globalStore.dispatch(addEcosystem(this))

    this.isInitialized = true
    preload?.(this, context as Context)
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

  public destroy(force?: boolean) {
    if (!force && this._refCount > 0) return

    // Check if this ecosystem has been destroyed manually already
    const ecosystem = globalStore.getState().ecosystems[this.ecosystemId]
    if (!ecosystem) return

    this.wipe()

    globalStore.dispatch(
      removeEcosystem({
        ecosystemId: this.ecosystemId,
      })
    )
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
    params: AtomParamsType<A>
  ): AtomInstanceType<A>

  public getInstance<AI extends AtomInstanceBase<any, [...any], any>>(
    instance: AI
  ): AI

  public getInstance<A extends AtomBase<any, [...any], any>>(
    atom: A | AtomInstanceBase<any, [...any], any>,
    params?: AtomParamsType<A>
  ) {
    if (is(atom, AtomInstanceBase)) {
      return atom
    }

    const keyHash = (atom as A).getKeyHash(params)

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
    this._instances[keyHash] = newInstance // TODO: dispatch an action over globalStore for this mutation

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
   * Atom instances can be shared across ecosystems by explicitly passing an
   * instance created in another ecosystem to this method. The instance will
   * behave normally in both ecosystems, except that the clone won't copy any of
   * the clonee's promise data.
   *
   * The instance will not be cleaned up before it's unregistered from this
   * ecosystem. The clone will not be cleaned up.
   */
  public registerExternalAtomInstance(instance: AnyAtomInstance) {
    const newInstance = instance.clone(this, true)
    const ghost = instance.ecosystem._graph.registerGhostDependent(
      instance,
      undefined,
      'registerExternalAtomInstance',
      true, // the clone subscribes to the clonee's store directly
      false,
      false,
      newInstance.keyHash
    )

    this._graph.addNode(newInstance.keyHash)
    this._instances[newInstance.keyHash] = newInstance // TODO: dispatch an action over globalStore for this mutation

    ghost.materialize()
  }

  public registerPlugin(plugin: ZeduxPlugin) {
    if (this.plugins.includes(plugin)) return

    this.plugins.push(plugin)
    this.recalculateMods()
  }

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

  public reset(newContext?: Context) {
    this.wipe()

    if (typeof newContext !== 'undefined') this.context = newContext

    this.cleanup =
      this._preload?.(this, newContext || (this.context as Context)) ||
      undefined
  }

  public select<T, Args extends any[]>(
    atomSelector: AtomSelectorOrConfig<T, Args>,
    ...args: Args
  ): T

  public select<A extends AtomBase<any, [], any>, D>(
    atom: A,
    selector: Selector<AtomStateType<A>, D>
  ): D

  public select<A extends AtomBase<any, [...any], any>, D>(
    atom: A,
    params: AtomParamsType<A>
  ): D

  public select<AI extends AtomInstanceBase<any, [], any>, D>(instance: AI): D

  public select<A extends AtomBase<any, [...any], any>, D = any>(
    atomOrInstanceOrSelector:
      | A
      | AtomInstanceBase<any, any, any>
      | AtomSelectorOrConfig<D, any>,
    paramsOrSelector?: AtomParamsType<A> | Selector<AtomStateType<A>, D>,
    selector?: Selector<AtomStateType<A>, D>,
    ...rest: any[]
  ) {
    if (
      typeof atomOrInstanceOrSelector === 'function' ||
      'selector' in atomOrInstanceOrSelector
    ) {
      const resolvedSelector =
        typeof atomOrInstanceOrSelector === 'function'
          ? atomOrInstanceOrSelector
          : atomOrInstanceOrSelector.selector

      return resolvedSelector(
        {
          ecosystem: this,
          get: this.get.bind(this),
          getInstance: this.getInstance.bind(this),
          select: this.select.bind(this),
        },
        paramsOrSelector,
        selector,
        ...rest
      )
    }

    const params = Array.isArray(paramsOrSelector)
      ? paramsOrSelector
      : (([] as unknown) as AtomParamsType<A>)

    const resolvedSelector =
      typeof paramsOrSelector === 'function'
        ? paramsOrSelector
        : (selector as Selector<AtomStateType<A>, D>)

    const instance = this.getInstance(atomOrInstanceOrSelector as A, params)

    return resolvedSelector(instance.store.getState())
  }

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
   * Unregister an external atom instance registered in this ecosystem via
   * `.registerExternalAtomInstance()`.
   *
   * The external atom instance won't be destroyed unless it is unregistered
   * here or the clone in this ecosystem is destroyed manually or implicitly
   * when this ecosystem is wiped
   */
  public unregisterExternalAtomInstance(instance: AnyAtomInstance) {
    this._instances[`${instance.keyHash}-clone`]?._destroy(true)
  }

  /**
   * Unregister a plugin registered in this ecosystem via `.registerPlugin()`
   */
  public unregisterPlugin(plugin: ZeduxPlugin) {
    if (!this.plugins.includes(plugin)) return

    this.plugins.splice(this.plugins.indexOf(plugin), 1)
    this.recalculateMods()
  }

  public wipe() {
    // call cleanup function first so it can configure the ecosystem for cleanup e.g. by removing external instances so they this ecosystem doesn't destroy them
    this.cleanup?.()

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
  }

  // Should only be used internally
  public _destroyAtomInstance(keyHash: string) {
    // try to destroy instance (if not destroyed - this fn is called as part of
    // that destruction process too)
    this._graph.removeNode(keyHash)

    delete this._instances[keyHash] // TODO: dispatch an action over globalStore for this mutation
  }

  private recalculateMods() {
    const pluginFns: {
      [K in keyof ZeduxPlugin]: NonNullable<ZeduxPlugin[K]>[]
    } = {
      onEcosystemWipe: [],
      onEdgeCreated: [],
      onEdgeRemoved: [],
      onGhostEdgeCreated: [],
      onGhostEdgeRemoved: [],
      onInstanceActiveStateChanged: [],
      onInstanceCreated: [],
      onInstanceDestroyed: [],
      onInstanceUpdated: [],
    }

    this.plugins.forEach(plugin => {
      Object.keys(plugin).forEach(key => {
        if (key in pluginFns) {
          pluginFns[key as keyof ZeduxPlugin]?.push(
            plugin[key as keyof ZeduxPlugin] as any
          )
        }
      })
    })

    this.mods = Object.entries(pluginFns).reduce((mods, [key, fns]) => {
      if (!fns?.length) return mods

      mods[key as keyof ZeduxPlugin] = (...args: any) =>
        fns?.forEach((fn: any) => fn(...args))
      return mods
    }, {} as Partial<ZeduxPlugin>)
  }

  private resolveAtom<AtomType extends AtomBase<any, any[], any>>(
    atom: AtomType
  ) {
    const override = this.overrides?.[atom.key]
    const maybeOverriddenAtom = (override || atom) as AtomType

    // to turn off flag checking, just don't pass a `flags` prop
    if (this.flags) {
      const badFlag = maybeOverriddenAtom.flags?.find(
        flag => !this.flags?.includes(flag)
      )

      if (DEV && badFlag) {
        console.error(
          `Zedux - encountered unsafe atom "${atom.key}" with flag "${badFlag}". This atom should be overridden in the current environment.`
        )
      }
    }

    return maybeOverriddenAtom
  }
}
