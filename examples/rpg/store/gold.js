import { act, createStore, react } from 'zedux'


export const buy = act('buy')
export const sell = act('sell')


export const reactor = react(500)
  .to(buy)
  .withReducers(buyReducer)

  .to(sell)
  .withReducers(sellReducer)


export default createStore()
  .use(reactor)





function buyReducer(state, { payload: amount }) {
  return state - amount
}


function sellReducer(state, { payload: amount }) {
  return state + amount
}
