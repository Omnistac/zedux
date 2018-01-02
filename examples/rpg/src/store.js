import { createStore } from 'zedux'


export default createStore()
  .use({
    entities: {
      weapons: weaponsReducer
    }
  })


export const selectWeaponCost = weaponName => state =>
  state.entities.weapons[weaponName].cost


function weaponsReducer(state, action) {
  return state || {
    broadsword: {
      cost: 680
    },
    crossbow: {
      cost: 1200
    },
    dagger: {
      cost: 50
    },
    katana: {
      cost: 450
    },
    staff: {
      cost: 200
    }
  }
}
