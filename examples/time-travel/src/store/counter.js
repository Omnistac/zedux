import { act, react } from 'zedux'


export const increment = act('increment')
export const decrement = act('decrement')


export default react(0)
  .to(increment)
  .withReducers(state => state + 1)

  .to(decrement)
  .withReducers(state => state - 1)
