import { createActorFactory } from '@zedux/core'
import {
  AtomBaseProperties,
  AtomContext,
  AtomContextInstance,
  AtomInstanceBase,
  Molecule,
} from '../types'

const createActor = createActorFactory('@@react-zedux', 'global')
export const addApp = createActor<{
  appId: string
  atoms?: AtomBaseProperties<any, any[]>[]
  atomContexts?: Map<AtomContext, AtomContextInstance>
  flags?: string[]
}>('addApp')
export const addAtomInstance = createActor<{
  appId: string
  atom: AtomBaseProperties<any, any[]>
  atomInstance: AtomInstanceBase<any, any[]>
}>('addAtomInstance')
export const addMolecule = createActor<Molecule<any, any>>('addMolecule')
export const removeApp = createActor<{
  appId: string
  instances: string[]
}>('removeApp')
export const removeAtomInstance = createActor<{
  appId: string
  keyHash: string
}>('removeAtomInstance')
export const updateApp = createActor<{
  appId: string
  atoms?: AtomBaseProperties<any, any[]>[]
  atomContexts?: Map<AtomContext, AtomContextInstance>
  flags?: string[]
}>('updateApp')
export const wipe = createActor('wipe')
