import React, { Component } from 'react'
import { act, createStore, react } from 'zedux'

import rootStore, { selectWeaponCost } from '../store'


const weaponsAct = act.namespace('weapons')


const buySellPayloadCreator = weaponName => ({
  name: weaponName,
  cost: selectWeaponCost(weaponName)(rootStore.getState())
})


export const buy = weaponsAct('buy')
  .payload(buySellPayloadCreator)

export const sell = weaponsAct('sell')
  .payload(buySellPayloadCreator)


const weaponsReactor = react([ 'dagger' ])
  .to(buy)
  .withReducers((state, { payload: { name } }) =>
    [ ...state, name ]
  )

  .to(sell)
  .withReducers((state, { payload: { name } }) =>
    state.filter(weapon => weapon !== name)
  )


function mountStore() {
  const weaponsStore = createStore()
    .use(weaponsReactor)

  rootStore.use({
    weapons: weaponsStore
  })

  return weaponsStore
}


export default class Weapons extends Component {
  constructor(props) {
    super(props)

    // Re-create the store every time this component mounts
    this.store = mountStore()

    this.state = {
      weapons: this.store.getState()
    }
  }


  componentWillMount() {
    this.subscription = this.store.subscribe(newState => {
      this.setState({
        weapons: newState
      })
    })
  }


  componentWillUnmount() {
    this.subscription.unsubscribe()
  }


  sell = event => {
    const weaponName = event.currentTarget.name

    rootStore.dispatch(sell(weaponName))
  }


  render() {
    const { weapons } = this.state

    return (
      <section>
        <h2>Weapons</h2>
        <ul>
          {weapons.map(weaponName =>
            <li key={weaponName}>
              <span>{weaponName}</span>
              <button onClick={this.sell} name={weaponName}>Sell</button>
            </li>
          )}
        </ul>
      </section>
    )
  }
}
