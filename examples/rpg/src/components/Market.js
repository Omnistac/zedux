import React, { Component } from 'react'
import { act, createStore, react } from 'zedux'

import rootStore from '../store'
import { buy, sell } from './Weapons'


const marketReactor = react([
    'broadsword',
    'crossbow',
    'katana',
    'staff'
  ])
  .to(buy)
  .withReducers((state, { payload: { name } }) =>
    state.filter(weapon => weapon !== name)
  )

  .to(sell)
  .withReducers((state, { payload: { name } }) =>
    [ ...state, name ]
  )


function mountStore() {
  const marketStore = createStore()
    .use(marketReactor)

  rootStore.use({
    market: marketStore
  })

  return marketStore
}


export default class Market extends Component {
  constructor(props) {
    super(props)

    // Re-create the store every time this component mounts
    this.store = mountStore()

    this.state = {
      market: this.store.getState()
    }
  }


  buy = event => {
    const weaponName = event.currentTarget.name

    rootStore.dispatch(buy(weaponName))
  }


  componentWillMount() {
    this.subscription = this.store.subscribe(newState => {
      this.setState({
        market: newState
      })
    })
  }


  componentWillUnmount() {
    this.subscription.unsubscribe()
  }


  render() {
    const { market } = this.state

    return (
      <section>
        <h2>Market</h2>
        <ul>
          {market.map(weaponName =>
            <li key={weaponName}>
              <span>{weaponName}</span>
              <button onClick={this.buy} name={weaponName}>Buy</button>
            </li>
          )}
        </ul>
      </section>
    )
  }
}
