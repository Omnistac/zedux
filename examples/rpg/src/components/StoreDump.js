import React, { Component } from 'react'

import store from '../store'


export default class StoreDump extends Component {
  constructor(props) {
    super(props)

    this.state = {
      rootState: store.getState()
    }
  }


  componentWillMount() {
    this.subscription = store.subscribe((oldState, newState) => {
      this.setState({
        rootState: newState
      })
    })
  }


  componentWillUnmount() {
    this.subscription.unsubscribe()
  }


  render() {
    const { rootState } = this.state

    return (
      <section>
        <h2>Root store state:</h2>
        <pre>
          {JSON.stringify(rootState, null, 2)}
        </pre>
      </section>
    )
  }
}
