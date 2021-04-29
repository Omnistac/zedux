import { createReducer } from '@zedux/core'
import { Ecosystem } from '../classes/Ecosystem'
import { addEcosystem, removeEcosystem, wipe } from './actions'

const initialState = {}

export const ecosystemsReducer = createReducer<{
  [ecosystemId: string]: Ecosystem
}>(initialState)
  .reduce(addEcosystem, (state, newEcosystem) => ({
    ...state,
    [newEcosystem.ecosystemId]: newEcosystem,
  }))
  .reduce(removeEcosystem, (state, { ecosystemId }) => {
    const newState = { ...state }
    delete newState[ecosystemId]

    return newState
  })
  .reduce(wipe, () => initialState)
