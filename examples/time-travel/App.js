import React, { Component, Fragment } from 'react'

import store from './store/store'
import { increment, decrement } from './store/counter'
import CounterButtons from './components/CounterButtons'
import CounterDisplay from './components/CounterDisplay'


export default class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      counter: store.getState()
    }
  }


  componentWillMount() {
    this.subscription = store.subscribe((oldState, newState) => {
      this.setState({
        counter: newState
      })
    })
  }


  componentWillUnmount() {
    this.subscription.unsubscribe()
  }


  increment() {
    store.dispatch(increment())
  }


  decrement() {
    store.dispatch(decrement())
  }


  render() {
    const { increment, decrement } = this
    const { counter } = this.state

    return (
      <Fragment>
        <CounterButtons {...{ increment, decrement }} />
        <CounterDisplay counter={counter} />
      </Fragment>
    )
  }
}
