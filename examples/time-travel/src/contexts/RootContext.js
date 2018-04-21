import { createContext } from 'react-zedux'
import { createStore } from 'zedux'

import withDevTools from './withDevTools'


export default createContext(
  withDevTools(createStore())
)
