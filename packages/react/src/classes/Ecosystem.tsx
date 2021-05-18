import React, { createContext, FC, useEffect, useRef } from 'react'
import { useStableReference } from '../hooks/useStableReference'
import { addEcosystem, globalStore, removeEcosystem } from '../store'
import {
  AtomContext,
  AtomContextInstance,
  EcosystemConfig,
  EcosystemProviderProps,
} from '../types'
import { generateAppId } from '../utils'
import { ecosystemCsContext } from '../utils/csContexts'
import { AtomBase } from './atoms/AtomBase'
import { Graph } from './Graph'
import { AtomInstanceBase } from './instances/AtomInstanceBase'
import { Scheduler } from './Scheduler'

const mapAtomContexts = (atomContexts?: AtomContextInstance[]) =>
  atomContexts?.reduce((map, atomContext) => {
    map.set(atomContext.atomContext, atomContext)
    return map
  }, new Map<AtomContext, AtomContextInstance>())

export const ecosystemContext = createContext('global')

export class Ecosystem {
  public atomContexts?: Map<AtomContext, AtomContextInstance>
  public destroyOnUnmount = false
  public ecosystemId: string
  public flags?: string[] = []
  public graph = new Graph(this)
  public instances: Record<string, AtomInstanceBase<any, any[], any>> = {}
  public overrides: Record<string, AtomBase<any, any[], any>> = {}
  public refCount = 0
  public scheduler = new Scheduler(this)

  constructor({
    contexts,
    destroyOnUnmount,
    flags,
    id,
    overrides,
  }: EcosystemConfig) {
    if (contexts && !Array.isArray(contexts)) {
      throw new TypeError(
        "Zedux Error - The Ecosystem's `contexts` property must be an array of AtomContext objects"
      )
    }
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

    if (contexts) {
      this.atomContexts = mapAtomContexts(contexts)
    }

    if (flags) {
      this.flags = flags
    }

    this.destroyOnUnmount = !!destroyOnUnmount

    // yep. Dispatch this here. We'll make sure no component can ever be updated sychronously from this call (causing state-update-during-render react warnings)
    globalStore.dispatch(addEcosystem(this))
  }

  // Should only be used internally
  public destroyAtomInstance(keyHash: string) {
    // try to destroy instance (if not destroyed - this fn is called as part of that destruction process too)
    this.graph.removeNode(keyHash)

    delete this.instances[keyHash] // TODO: dispatch an action over globalStore for this mutation
  }

  public getAtomContextInstance<T extends any = any>(
    atomContext: AtomContext<T>
  ) {
    const instance = this.atomContexts?.get(atomContext)

    if (!instance) {
      throw new Error(
        `Zedux - given atom context has not been provided in ecosystem "${this.ecosystemId}"`
      )
    }

    return instance
  }

  public load<InstanceType extends AtomInstanceBase<any, [], any>>(
    atom: AtomBase<any, [], InstanceType>
  ): InstanceType

  public load<
    P extends any[],
    InstanceType extends AtomInstanceBase<any, [...P], any>
  >(atom: AtomBase<any, [...P], InstanceType>, params: [...P]): InstanceType

  public load<
    S,
    InstanceType extends AtomInstanceBase<S, [], AtomType>,
    AtomType extends AtomBase<S, [], InstanceType>
  >(atom: AtomType): InstanceType

  public load<
    S,
    P extends any[],
    InstanceType extends AtomInstanceBase<S, [...P], AtomType>,
    AtomType extends AtomBase<S, [...P], InstanceType>
  >(atom: AtomType, params: [...P]): InstanceType

  public load<
    State,
    Params extends any[],
    InstanceType extends AtomInstanceBase<State, Params, any>
  >(atom: AtomBase<State, Params, InstanceType>, params?: Params) {
    const keyHash = atom.getKeyHash(params as Params)

    // try to find an existing instance
    const existingInstance = this.instances[keyHash]
    if (existingInstance) return existingInstance as InstanceType

    // create a new instance
    const resolvedAtom = this.resolveAtom(atom)
    this.graph.addNode(keyHash)

    const newInstance = resolvedAtom.createInstance(
      this,
      keyHash,
      params || (([] as unknown) as Params)
    )
    this.instances[keyHash] = newInstance // TODO: dispatch an action over globalStore for this mutation

    return newInstance
  }

  public Provider: FC<EcosystemProviderProps> = ({
    children,
    contexts,
    flags,
    overrides,
    preload,
  }) => {
    const isFirstRenderRef = useRef(true)

    if (contexts && !Array.isArray(contexts)) {
      throw new TypeError(
        "Zedux Error - The EcosystemProvider's `contexts` prop must be an array of AtomContext objects"
      )
    }
    if (flags && !Array.isArray(flags)) {
      throw new TypeError(
        "Zedux Error - The EcosystemProvider's `flags` prop must be an array of strings"
      )
    }
    if (overrides && !Array.isArray(overrides)) {
      throw new TypeError(
        "Zedux Error - The EcosystemProvider's `overrides` prop must be an array of Atom objects"
      )
    }

    const preservedContexts = useStableReference(contexts)
    const preservedFlags = useStableReference(flags)
    const preservedOverrides = useStableReference(overrides)

    useEffect(() => {
      if (isFirstRenderRef.current) return

      console.warn(
        "Zedux Warning - Dynamically updating an ecosystem's overrides, atom contexts, and flags is not currently supported."
      )
      // TODO: Update class members and trigger evaluations
    }, [preservedContexts, preservedFlags, preservedOverrides])

    useEffect(() => {
      this.refCount += 1

      return () => {
        this.refCount -= 1
        if (this.refCount > 0 || !this.destroyOnUnmount) return

        // Check if this ecosystem has been destroyed manually already
        const ecosystem = globalStore.getState().ecosystems[this.ecosystemId]
        if (!ecosystem) return

        globalStore.dispatch(
          removeEcosystem({
            ecosystemId: this.ecosystemId,
          })
        )
        this.wipe()
      }
    }, [])

    useEffect(() => {
      // I think it's fine to assume this effect runs after the others in this file. Easy to change approaches if not.
      isFirstRenderRef.current = false
    }, [])

    useEffect(() => {
      if (!preload) return

      ecosystemCsContext.provide({ ecosystemId: this.ecosystemId }, () =>
        preload(this)
      )
    }, [])

    return (
      <ecosystemContext.Provider value={this.ecosystemId}>
        {children}
      </ecosystemContext.Provider>
    )
  }

  public wipe() {
    Object.values(this.instances).forEach(instance => {
      instance._destroy()
    })

    this.graph.wipe()
    this.scheduler.wipe()
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
