import React, { createContext, FC, useEffect, useRef } from 'react'
import { useStableReference } from '../hooks/useStableReference'
import { createAtomInstance } from '../instance-helpers/createAtomInstance'
import { addEcosystem, globalStore, removeEcosystem } from '../store'
import {
  AtomBaseProperties,
  AtomContext,
  AtomContextInstance,
  AtomInstanceBase,
  EcosystemConfig,
  EcosystemProviderProps,
} from '../types'
import { generateAppId, getKeyHash } from '../utils'
import { ecosystemCsContext } from '../utils/csContexts'
import { Graph } from './Graph'
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
  public instances: Record<string, AtomInstanceBase<any, any>> = {}
  public overrides: Record<string, AtomBaseProperties<any, any[]>> = {}
  public refCount = 0
  public scheduler = new Scheduler(this)

  constructor({
    atoms,
    contexts,
    destroyOnUnmount,
    flags,
    id,
  }: EcosystemConfig) {
    if (atoms && !Array.isArray(atoms)) {
      throw new TypeError(
        "Zedux Error - The Ecosystem's `atoms` property must be an array of Atom objects"
      )
    }
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

    this.ecosystemId = id || generateAppId()
    if (atoms) {
      this.overrides = atoms.reduce(
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

  public destroy() {
    // TODO: Find all leaf nodes in the graph, iterate over those, and destroy each - that'll clean up everything in a good order
  }

  public destroyAtomInstance(keyHash: string) {
    // try to destroy instance (if not destroyed - this fn is called as part of that destruction process too)
    this.graph.removeNode(keyHash)

    delete this.instances[keyHash] // TODO: dispatch an action over globalStore for this mutation
  }

  public load<
    State,
    Params extends any[],
    InstanceType extends AtomInstanceBase<State, Params>
  >(atom: AtomBaseProperties<State, Params, InstanceType>, params: Params) {
    const keyHash = getKeyHash(this.ecosystemId, atom, params)

    // try to find an existing instance
    const existingInstance = this.instances[keyHash]
    if (existingInstance) return existingInstance as InstanceType

    // create a new instance
    const resolvedAtom = this.resolveAtom(atom)
    this.graph.addNode(keyHash)

    const newInstance = createAtomInstance(this, resolvedAtom, keyHash, params)
    this.instances[keyHash] = newInstance // TODO: dispatch an action over globalStore for this mutation

    return newInstance
  }

  public Provider: FC<EcosystemProviderProps> = ({
    atoms,
    children,
    contexts,
    flags,
    preload,
  }) => {
    const isFirstRenderRef = useRef(true)

    if (atoms && !Array.isArray(atoms)) {
      throw new TypeError(
        "Zedux Error - The EcosystemProvider's `atoms` prop must be an array of Atom objects"
      )
    }
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

    const preservedAtoms = useStableReference(atoms)
    const preservedContexts = useStableReference(contexts)
    const preservedFlags = useStableReference(flags)

    useEffect(() => {
      if (isFirstRenderRef.current) return

      console.warn(
        "Zedux Warning - Dynamically updating an ecosystem's overrides, atom contexts, and flags is not currently supported."
      )
      // TODO: Update class members and trigger evaluations
    }, [preservedAtoms, preservedContexts, preservedFlags])

    useEffect(() => {
      this.refCount += 1

      return () => {
        this.refCount -= 1
        if (this.refCount > 0 || !this.destroyOnUnmount) return

        // Check if this ecosystem has been destroyed manually already
        const ecosystem = globalStore.getState().ecosystems[this.ecosystemId]
        if (!ecosystem) return

        // TODO: iterate over the instances in an effect and destroy them all
        globalStore.dispatch(
          removeEcosystem({
            ecosystemId: this.ecosystemId,
          })
        )
      }
    }, [])

    useEffect(() => {
      // I think it's fine to assume this effect runs after the others in this file. Easy to change approaches if not.
      isFirstRenderRef.current = false
    }, [])

    useEffect(() => {
      if (!preload) return

      ecosystemCsContext.provide({ ecosystemId: this.ecosystemId }, preload)
    }, [])

    return (
      <ecosystemContext.Provider value={this.ecosystemId}>
        {children}
      </ecosystemContext.Provider>
    )
  }

  private resolveAtom<AtomType extends AtomBaseProperties<any, any[]>>(
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
          `Zedux - encountered unsafe atom "${atom.key}" with flag "${badFlag}. This atom should be overridden in the current environment.`
        )
      }
    }

    return maybeOverriddenAtom
  }
}
