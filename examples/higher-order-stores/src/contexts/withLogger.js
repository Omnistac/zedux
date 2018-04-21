import { createStore } from 'zedux'


const NO_CHANGE = 'action changed nuthin\''
const CHANGE = 'action caused state change'
const ERROR = 'action caused error'


export default wrappedStore => {
  const loggerStore = createStore()

  loggerStore.inspect((storeBase, action) => ({
    next(newState, oldState) {
      const text = newState === oldState ? NO_CHANGE : CHANGE

      console.log(text, action, newState)
    },

    error(error, state) {
      console.log(ERROR, action, error)
    }
  }))

  return loggerStore.use(wrappedStore)
}