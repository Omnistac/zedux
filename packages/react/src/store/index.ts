import { createStore } from '@zedux/core'
import { ecosystemsReducer } from './ecosystems'

export * from './actions'

export const globalStore = createStore({
  ecosystems: ecosystemsReducer,
})
