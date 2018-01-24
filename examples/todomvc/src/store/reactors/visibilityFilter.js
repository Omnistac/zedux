import { act, react } from 'zedux'


export const showAll = act('showAll')
export const showComplete = act('showComplete')
export const showIncomplete = act('showIncomplete')


export default react(showAll.type)
  .to(showAll, showComplete, showIncomplete)
  .withReducers(visibilityFilterReducer)





function visibilityFilterReducer(state, action) {
  return action.type
}
