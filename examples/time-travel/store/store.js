import { createStore } from 'zedux'

import counter from './counter'
import wrapInDevTools from './wrapInDevTools'


const devTools = window.__REDUX_DEVTOOLS_EXTENSION__
  && window.__REDUX_DEVTOOLS_EXTENSION__()


const store = createStore()
  .use(counter)


export default wrapInDevTools(store)
