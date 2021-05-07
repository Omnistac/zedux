import { createStore } from '@zedux/core'
import { atomsReducer } from './atoms'
import { ecosystemsReducer } from './ecosystems'

export * from './actions'

export const globalStore = createStore({
  atoms: atomsReducer,
  ecosystems: ecosystemsReducer,
})
