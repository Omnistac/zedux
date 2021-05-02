import { createStore } from '@zedux/core'
import { atomsReducer } from './atoms'
import { ecosystemsReducer } from './ecosystems'

export * from './actions'

export const globalStore = createStore({
  atoms: atomsReducer,
  ecosystems: ecosystemsReducer,
})
// ;(window as any).globalStore = globalStore

// globalStore.subscribe({
//   effects: ({ action }) => console.log('global store got action:', action),
// })
// globalStore.subscribe(newState =>
//   console.log('global store state change', newState, globalStore)
// )
