import React, { Component } from 'react'
import { createStore, react } from 'zedux'

import rootStore from '../store'
import { buy, sell } from './Weapons'


const goldReactor = react(900)
  .to(buy)
  .withReducers((state, { payload: { cost } }) => state - cost)

  .to(sell)
  .withReducers((state, { payload: { cost } }) => state + cost)


function mountStore() {
  const goldStore = createStore()
    .use(goldReactor)

  rootStore.use({
    gold: goldStore
  })

  return goldStore
}


export default class Gold extends Component {
  constructor(props) {
    super(props)

    // Re-create the store every time this component mounts
    this.store = mountStore()

    this.state = {
      gold: this.store.getState()
    }
  }


  componentWillMount() {
    this.subscription = this.store.subscribe(newState => {
      this.setState({
        gold: newState
      })
    })
  }


  componentWillUnmount() {
    this.subscription.unsubscribe()
  }


  render() {
    const { gold } = this.state

    return (
      <section>
        <h2>Gold</h2>
        <p>Current amount: {gold}</p>
      </section>
    )
  }
}
