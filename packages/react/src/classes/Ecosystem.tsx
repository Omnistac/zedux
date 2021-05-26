import { createContext } from 'react'
import { addEcosystem, globalStore, removeEcosystem } from '../store'
import { AtomInstanceType, AtomParamsType, EcosystemConfig } from '../types'
import { generateAppId } from '../utils'
import { AtomBase } from './atoms/AtomBase'
import { Graph } from './Graph'
import { AtomInstanceBase } from './instances/AtomInstanceBase'
import { Scheduler } from './Scheduler'

export const ecosystemContext = createContext('global')

export class Ecosystem {
  public _graph = new Graph(this)
  public _instances: Record<
    string,
    AtomInstanceBase<any, any[], AtomBase<any, any[], any>>
  > = {}
  public _preload?: (ecosystem: this) => void
  public _refCount = 0
  public _scheduler = new Scheduler(this)
  public destroyOnUnmount = false
  public ecosystemId: string
  public flags?: string[] = []
  public overrides: Record<string, AtomBase<any, any[], any>> = {}

  constructor({
    destroyOnUnmount,
    flags,
    id,
    overrides,
    preload,
  }: EcosystemConfig) {
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
      this.overrides = overrides.reduce(
        (map, atom) => ({
          ...map,
          [atom.key]: atom,
        }),
        {}
      )
    }

    if (flags) {
      this.flags = flags
    }

    this.destroyOnUnmount = !!destroyOnUnmount
    this._preload = preload

    // yep. Dispatch this here. We'll make sure no component can ever be updated sychronously from this call (causing state-update-during-render react warnings)
    globalStore.dispatch(addEcosystem(this))

    preload?.(this)
  }

  // Should only be used internally
  public _destroyAtomInstance(keyHash: string) {
    // try to destroy instance (if not destroyed - this fn is called as part of that destruction process too)
    this._graph.removeNode(keyHash)

    delete this._instances[keyHash] // TODO: dispatch an action over globalStore for this mutation
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

  public inspectInstanceValues(atom?: AtomBase<any, any[], any> | string) {
    const hash: Record<string, any> = {}
    const filterKey = typeof atom === 'string' ? atom : atom?.key

    Object.entries(this._instances)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, instance]) => {
        if (filterKey && instance.atom.key !== filterKey) return

        hash[key] = instance._stateStore.getState()
      })

    return hash
  }

  public load<A extends AtomBase<any, [], any>>(atom: A): AtomInstanceType<A>
  public load<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomInstanceType<A>

  public load<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params?: AtomParamsType<A>
  ) {
    const keyHash = atom.getKeyHash(params as AtomParamsType<A>)

    // try to find an existing instance
    const existingInstance = this._instances[keyHash]
    if (existingInstance) return existingInstance as AtomInstanceType<A>

    // create a new instance
    const resolvedAtom = this.resolveAtom(atom)
    this._graph.addNode(keyHash)

    const newInstance = resolvedAtom.createInstance(
      this,
      keyHash,
      params || (([] as unknown) as AtomParamsType<A>)
    )
    this._instances[keyHash] = newInstance // TODO: dispatch an action over globalStore for this mutation

    return newInstance
  }

  public reset() {
    this.wipe()
    this._preload?.(this)
  }

  public wipe() {
    Object.values(this._instances).forEach(instance => {
      instance._destroy()
    })

    this._graph.wipe()
    this._scheduler.wipe()
  }

  private resolveAtom<AtomType extends AtomBase<any, any[], any>>(
    atom: AtomType
  ) {
    const override = this.overrides?.[atom.key]
    const maybeOverriddenAtom = (override || atom) as AtomType

    // to turn off flag checking, just don't pass the `flags` prop to `<EcosystemProvider />`
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
