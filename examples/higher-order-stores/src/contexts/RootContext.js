import { createContext } from 'react-zedux'
import { createStore } from 'zedux'

import withDevTools from '../../../time-travel/src/contexts/withDevTools'
import withLogger from './withLogger'


const rootStore = compose(
  withDevTools,
  withLogger
)(createStore())


export default createContext(rootStore)
