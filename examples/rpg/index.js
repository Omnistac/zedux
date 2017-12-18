import store from './store/store'
import { buy, sell } from './store/gold'
import { buyWeapon, sellWeapon } from './store/weapons'


store.subscribe(() => {
  console.log('store state changed', store.getState())
})


store.dispatch(buy(200))
store.dispatch(sell(500))

store.dispatch(buyWeapon('crossbow'))
