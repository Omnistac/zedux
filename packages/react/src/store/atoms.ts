import { createReducer } from '@zedux/core'
import { AtomBaseProperties } from '../types'
import { addAtomInstance, wipe } from './actions'

// TODO: This (how will tracking atom implementations work with hot reloading)
export const atomsReducer = createReducer<{
  [implementationId: string]: AtomBaseProperties<any, any[]>
}>({})
  .reduce(addAtomInstance, (state, { atom }) => ({
    ...state,
    [atom.key]: atom,
  }))
  .reduce(wipe, () => ({}))
