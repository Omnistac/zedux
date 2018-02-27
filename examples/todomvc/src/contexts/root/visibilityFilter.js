import { state, transition } from 'zedux'


export const showAll = state('showAll')
export const showComplete = state('showComplete')
export const showIncomplete = state('showIncomplete')


export default transition(showAll)
  .undirected(showAll, showComplete, showIncomplete)
