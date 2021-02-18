import { useEffect, useState as useReactState } from 'react'
import { createStore } from '@zedux/core'
import { addMolecule, globalStore } from './global/store'
import { AtomInstance, AtomMetadata, Molecule } from './types'

const getState = (atoms?: Record<string, AtomMetadata>) => {
  if (!atoms) return []

  return Object.values(atoms).map(atomMetadata => atomMetadata.state)
}

export const createMolecule = <T = any>(key: string): Molecule<T> => {
  const existingMolecule = globalStore.getState().molecules[key]
  if (existingMolecule) return existingMolecule

  const store = createStore<Record<string, AtomMetadata>>()

  const addAtom = (atom: AtomInstance<T>) => {
    // TODO: what if the atom already exists in the store?
    store.use({ [atom.key]: atom.metaStore })
  }

  const useValue = () => {
    const atoms = store.getState()
    const [state, setState] = useReactState(getState(atoms))

    useEffect(() => {
      // update react state if the molecule's store state has changed since render, but before this effect was called
      const currentAtoms = store.getState()
      if (currentAtoms !== atoms) setState(getState(currentAtoms))

      // update react state every time the molecule's store state changes
      const { unsubscribe } = store.subscribe(val => {
        setState(getState(val))
      })

      return unsubscribe
    }, [])

    return state
  }

  const molecule: Molecule<T> = { addAtom, key, store, useValue }

  globalStore.dispatch(addMolecule(molecule))

  return molecule
}

/*

molecules need to be either limited to atoms of a single scope type OR need to always be global.

We're opting for global - multi-app apps are rare and why would multiple apps be using the same molecule.
In fact .. molecules could be used for cross-app communication with this approach. Prob not useful.

*/
