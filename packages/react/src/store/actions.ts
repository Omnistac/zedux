import { createActorFactory } from '@zedux/core'
import { Atom, AtomInstanceBase, Molecule } from '../types'

const createActor = createActorFactory('@@react-zedux', 'global')
export const addApp = createActor<{
  appId: string
  atoms?: Atom[]
  flags?: string[]
}>('addApp')
export const addAtomImplementation = createActor<Atom>('addAtomImplementation')
export const addAtomInstance = createActor<{
  appId: string
  atomInstance: AtomInstanceBase
}>('addAtomInstance')
export const addMolecule = createActor<Molecule>('addMolecule')
export const removeApp = createActor<{
  appId: string
  instances: Record<string, string>
}>('removeApp')
export const removeAtomInstance = createActor<{
  appId: string
  keyHash: string
  internalId: string
  key: string
}>('removeAtomInstance')
export const wipe = createActor('wipe')
