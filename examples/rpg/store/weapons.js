import { act, react } from 'zedux'


export const buyWeapon = act('buyWeapon')
export const sellWeapon = act('sellWeapon')


export default react([ 'dagger' ])
  .to(buyWeapon)
  .withReducers(buyReducer)

  .to(sellWeapon)
  .withReducers(sellReducer)





function buyReducer(state, { payload: weaponName }) {
  return [
    ...state,
    weaponName
  ]
}


function sellReducer(state, { payload: weaponName }) {
  let index = state.indexOf(weaponName)

  if (index === -1) return state

  return [
    ...state.slice(0, index),
    ...state.slice(index + 1)
  ]
}
