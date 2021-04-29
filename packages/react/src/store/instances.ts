import { createReducer } from '@zedux/core'
import { AtomInstanceBase } from '../types'
import {
  addAtomInstance,
  removeAtomInstance,
  removeEcosystem,
  wipe,
} from './actions'

export const instancesReducer = createReducer<
  Record<string, AtomInstanceBase<any, any>>
>({})
  .reduce(addAtomInstance, (state, { atomInstance }) => ({
    ...state,
    [atomInstance.internals.keyHash]: atomInstance,
  }))
  .reduce(removeEcosystem, (state, { instances }) => {
    const newState = { ...state }

    instances.forEach(keyHash => {
      delete newState[keyHash]
    })

    return newState
  })
  .reduce(removeAtomInstance, (state, { keyHash }) => {
    const newInstances = { ...state }
    delete newInstances[keyHash]

    return newInstances
  })
  .reduce(wipe, () => ({}))
