import { createStore, Store, removeAllMeta } from '@zedux'

export const withLogger = (wrappedStore: Store) => {
  const loggerStore = createStore()

  loggerStore.subscribe({
    effects: ({ action, error, newState, oldState }) => {
      const rawAction = removeAllMeta(action)

      if (error) {
        console.groupCollapsed(
          `Zedux Logger: Action "${rawAction.type}" caused an error`
        )
        console.log('action:', action)
        console.log('error:', error)
        console.log('state:', newState)
        console.groupEnd()
        return
      }

      if (newState === oldState) {
        console.groupCollapsed(
          `Zedux Logger: Action "${rawAction.type}" caused no change`
        )
        console.log('action:', action)
        console.log('state:', newState)
        console.groupEnd()
      }

      console.groupCollapsed(
        `Zedux Logger: Action "${rawAction.type}" caused state change`
      )
      console.log('previous state:', oldState)
      console.log('action:', action)
      console.log('next state:', newState)
      console.groupEnd()
    },
  })

  return loggerStore.use(wrappedStore)
}
