import { createReducer } from '@zedux/core'
import { Atom } from '../classes'
import { addAtomInstance, wipe } from './actions'

// TODO: how will tracking atom implementations work with hot reloading?
export const atomsReducer = createReducer<{
  [implementationId: string]: Atom<any, [...any], any>
}>({})
  .reduce(addAtomInstance, (state, { atom }) => ({
    ...state,
    [atom.internalId]: atom,
  }))
  .reduce(wipe, () => ({}))
