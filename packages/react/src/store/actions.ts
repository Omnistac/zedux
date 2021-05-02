import { createActorFactory } from '@zedux/core'
import { Ecosystem } from '../classes/Ecosystem'
import {
  AtomBaseProperties,
  AtomContext,
  AtomContextInstance,
  AtomInstanceBase,
  Molecule,
} from '../types'

const createActor = createActorFactory('@@react-zedux', 'global')
export const addEcosystem = createActor<Ecosystem>('addEcosystem')

// should only be dispatched from an Ecosystem
export const addAtomInstance = createActor<{
  ecosystemId: string
  atom: AtomBaseProperties<any, any[]>
  atomInstance: AtomInstanceBase<any, any[]>
}>('addAtomInstance')

export const addMolecule = createActor<Molecule<any, any>>('addMolecule')

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
  atoms?: AtomBaseProperties<any, any[]>[]
  atomContexts?: Map<AtomContext, AtomContextInstance>
  flags?: string[]
}>('updateEcosystem')

export const wipe = createActor('wipe')
