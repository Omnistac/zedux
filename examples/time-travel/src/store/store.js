import { createStore } from 'zedux'

import counter from './counter'
import withDevTools from './withDevTools'


const devTools = window.__REDUX_DEVTOOLS_EXTENSION__
  && window.__REDUX_DEVTOOLS_EXTENSION__()


const store = createStore()
  .use(counter)


export default withDevTools(store)
