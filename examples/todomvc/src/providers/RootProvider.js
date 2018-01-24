import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Provider, withStores } from 'react-zedux'

import rootStoreInterface from './root/interface'


export default class RootProvider extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired
  }


  render() {
    return (
      <Provider id={RootProvider} store={rootStoreInterface}>
        {this.props.children}
      </Provider>
    )
  }
}


export const withRoot = withStores({
  rootStore: RootProvider
})
