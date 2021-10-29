import { Selector } from '@zedux/core'
import { createContext } from 'react'
import { addEcosystem, globalStore, removeEcosystem } from '../store'
import {
  AnyAtomInstanceBase,
  AtomInstanceStateType,
  AtomInstanceType,
  AtomParamsType,
  AtomSelector,
  AtomStateType,
  EcosystemConfig,
} from '../types'
import { generateAppId, is } from '../utils'
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
  public _graph: Graph = new Graph(this)
  public _instances: Record<string, AtomInstance<any, any[], any>> = {}
  public _destroyOnUnmount = false
  public _preload?: (ecosystem: this, context: Context) => void
  public _refCount = 0
  public _scheduler: Scheduler = new Scheduler(this)
  public context?: Context
  public defaultForwardPromises?: boolean
  public defaultTtl?: number
  public ecosystemId: string
  public flags?: string[] = []
  public overrides: Record<string, AtomBase<any, any[], any>> = {}
  private isInitialized = false

  constructor({
    context,
    defaultForwardPromises,
    defaultTtl,
    destroyOnUnmount,
    flags,
    id,
    overrides,
    preload,
  }: EcosystemConfig<Context>) {
    if (flags && !Array.isArray(flags)) {
      throw new TypeError(
        "Zedux Error - The Ecosystem's `flags` property must be an array of strings"
      )
    }
    if (overrides && !Array.isArray(overrides)) {
      throw new TypeError(
        "Zedux Error - The Ecosystem's `overrides` property must be an array of Atom objects"
      )
    }

    this.ecosystemId = id || generateAppId()

    if (overrides) {
      this.setOverrides(overrides)
    }

    if (flags) {
      this.flags = flags
    }

    this.context = context
    this.defaultForwardPromises = defaultForwardPromises
    this.defaultTtl = defaultTtl ?? -1
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

    const defaultedParams = (params || []) as AtomParamsType<A>
    const keyHash = (atom as A).getKeyHash(defaultedParams)

    // try to find an existing instance
    const existingInstance = this._instances[keyHash]
    if (existingInstance) return existingInstance

    // create a new instance
    const resolvedAtom = this.resolveAtom(atom as A)
    this._graph.addNode(keyHash)

    const newInstance = resolvedAtom._createInstance(
      this,
      keyHash,
      defaultedParams
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

    if (newContext) this.context = newContext

    this._preload?.(this, newContext || (this.context as Context))
  }

  public select<A extends AtomBase<any, [], any>, D>(
    atom: A,
    selector: Selector<AtomStateType<A>, D>
  ): D

  public select<A extends AtomBase<any, [...any], any>, D>(
    atom: A,
    params: AtomParamsType<A>
  ): D

  public select<AI extends AtomInstanceBase<any, [], any>, D>(instance: AI): D

  public select<D>(atomSelector: AtomSelector<D>): D

  public select<A extends AtomBase<any, [...any], any>, D = any>(
    atomOrInstanceOrSelector:
      | A
      | AtomInstanceBase<any, any, any>
      | AtomSelector,
    paramsOrSelector?: AtomParamsType<A> | Selector<AtomStateType<A>, D>,
    selector?: Selector<AtomStateType<A>, D>
  ) {
    if (typeof atomOrInstanceOrSelector === 'function') {
      return atomOrInstanceOrSelector({
        ecosystem: this,
        get: this.get.bind(this),
        getInstance: this.getInstance.bind(this),
        select: this.select.bind(this),
      })
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

  public wipe() {
    // TODO: Delete nodes in an optimal order (starting with leaf nodes - nodes
    // with no internal dependents).
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

      if (badFlag) {
        console.error(
          `Zedux - encountered unsafe atom "${atom.key}" with flag "${badFlag}". This atom should be overridden in the current environment.`
        )
      }
    }

    return maybeOverriddenAtom
  }
}
