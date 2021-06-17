import { createActorFactory } from '@zedux/core'
import { Atom, AtomInstance } from '../classes'
import { Ecosystem } from '../classes/Ecosystem'

const createActor = createActorFactory('@@react-zedux', 'global')
export const addEcosystem = createActor<Ecosystem>('addEcosystem')

// should only be dispatched from an Ecosystem
export const addAtomInstance = createActor<{
  ecosystemId: string
  atom: Atom<any, [...any], any>
  atomInstance: AtomInstance<any, [...any], any, any>
}>('addAtomInstance')

// export const addMolecule = createActor<Molecule<any, any>>('addMolecule')

export const removeEcosystem = createActor<{
  ecosystemId: string
}>('removeEcosystem')

// should only be dispatched from an Ecosystem
export const removeAtomInstance = createActor<{
  ecosystemId: string
  keyHash: string
}>('removeAtomInstance')

export const updateEcosystem = createActor<{
  ecosystemId: string
  atoms?: Atom<any, [...any], any>[]
  flags?: string[]
}>('updateEcosystem')

export const wipe = createActor('wipe')
