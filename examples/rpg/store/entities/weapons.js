import { act, react } from 'zedux'


export const weaponFetched = act('weaponFetched')


const initialState = {
  crossbow: {
    cost: 2200,
    damage: 28
  },
  dagger: {
    cost: 400,
    damage: 7
  }
}


export default react(initialState)
  .to(weaponFetched)
  .withReducers(weaponFetchedReducer)





function weaponFetchedReducer(state, { payload: newWeapon }) {
  return {
    ...state,
    newWeapon
  }
}
