import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Provider, createStore, withStores } from 'react-zedux'

import { withRoot } from './RootProvider'


let storeIdCounter = 0


class CounterProvider extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    rootStore: PropTypes.object.isRequired // from container
  }


  constructor(props) {
    super(props)

    // Create the component-bound store
    const store = createStore()
      .hydrate(0)

    // Attach some bound inducers to the store
    store.increment = () => store.dispatch(state => state + 1)
    store.decrement = () => store.dispatch(state => state - 1)

    this.store = store
    this.storeId = `counter${storeIdCounter++}`
  }


  // Attach the component-bound store to the global store
  componentDidMount() {
    this.props.rootStore.use({ [this.storeId]: this.store })
  }


  // Unattach the comonent-bound store from the global store
  componentWillUnmount() {
    this.props.rootStore.use({ [this.storeId]: null })
  }


  render() {
    return (
      <Provider id={CounterProvider} store={this.store}>
        {this.props.children}
      </Provider>
    )
  }
}


export default withRoot(CounterProvider)


// Partially apply the withStores() HOC to get a withCounter() HOC.
// All components enhanced by withCounter() will receive a `counterStore` prop.
export const withCounter = withStores({
  counterStore: CounterProvider
})
