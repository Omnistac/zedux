import { createReducer, createStore } from '@zedux/core'
import { Molecule } from '../types'
import { addMolecule, wipe } from './actions'
import { atomsReducer } from './atoms'
import { poolsReducer } from './pools'

const moleculesReducer = createReducer<Record<string, Molecule>>({})
  .reduce(addMolecule, (state, molecule) => ({
    ...state,
    [molecule.key]: molecule,
  }))
  .reduce(wipe, () => ({}))

export * from './actions'

export const globalStore = createStore({
  atoms: atomsReducer,
  molecules: moleculesReducer,
  pools: poolsReducer,
})
;(window as any).globalStore = globalStore

// globalStore.subscribe({
//   effects: ({ action }) => console.log('global store got action:', action),
// })
// globalStore.subscribe(newState =>
//   console.log('global store state change', newState, globalStore)
// )
