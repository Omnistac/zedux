import { createActorFactory } from '@zedux/core'
import {
  Atom,
  AtomContext,
  AtomContextInstance,
  AtomInstanceBase,
  Molecule,
} from '../types'

const createActor = createActorFactory('@@react-zedux', 'global')
export const addApp = createActor<{
  appId: string
  atoms?: Atom[]
  atomContexts?: Map<AtomContext, AtomContextInstance>
  flags?: string[]
}>('addApp')
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
export const updateApp = createActor<{
  appId: string
  atoms?: Atom[]
  atomContexts?: Map<AtomContext, AtomContextInstance>
  flags?: string[]
}>('updateApp')
export const wipe = createActor('wipe')
