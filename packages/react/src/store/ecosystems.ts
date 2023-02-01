import { createReducer } from '@zedux/core'
import { Ecosystem } from '../classes/Ecosystem'
import { addEcosystem, removeEcosystem, wipe } from './actions'

const initialState = {}

export const ecosystemsReducer = createReducer<{
  [id: string]: Ecosystem
}>(initialState)
  .reduce(addEcosystem, (state, newEcosystem) => ({
    ...state,
    [newEcosystem.id]: newEcosystem,
  }))
  .reduce(removeEcosystem, (state, { id }) => {
    const newState = { ...state }
    delete newState[id]

    return newState
  })
  .reduce(wipe, () => initialState)
