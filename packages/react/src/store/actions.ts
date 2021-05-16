import { createActorFactory } from '@zedux/core'
import { AtomBase, AtomInstanceBase } from '../classes'
import { Ecosystem } from '../classes/Ecosystem'
import { AtomContext, AtomContextInstance } from '../types'

const createActor = createActorFactory('@@react-zedux', 'global')
export const addEcosystem = createActor<Ecosystem>('addEcosystem')

// should only be dispatched from an Ecosystem
export const addAtomInstance = createActor<{
  ecosystemId: string
  atom: AtomBase<any, any[], any>
  atomInstance: AtomInstanceBase<any, any[], any>
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
  atoms?: AtomBase<any, any[], any>[]
  atomContexts?: Map<AtomContext, AtomContextInstance>
  flags?: string[]
}>('updateEcosystem')

export const wipe = createActor('wipe')
