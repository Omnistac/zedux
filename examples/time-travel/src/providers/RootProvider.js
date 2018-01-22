import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Provider, createStore, withStores } from 'react-zedux'

import withDevTools from '../withDevTools'


export default class RootProvider extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired
  }


  store = withDevTools(createStore())


  componentDidMount() {
    console.log('subscribing...')

    this.store.subscribe((oldState, newState) => {
      console.log('store state updated:', oldState, newState)
    })
  }


  render() {
    return (
      <Provider id={RootProvider} store={this.store}>
        {this.props.children}
      </Provider>
    )
  }
}


// Partially apply the withStores() HOC to get a withRoot() HOC.
// All components enhanced by withRoot() will receive a `rootStore` prop.
export const withRoot = withStores({
  rootStore: RootProvider
})
