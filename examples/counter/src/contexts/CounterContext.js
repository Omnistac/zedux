import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { StoreApi, createContext } from 'react-zedux'
import { createStore } from 'zedux'


let storeIdCounter = 0


class CounterApi extends StoreApi {
  id = `counter${storeIdCounter++}`
  store = createStore()
    .hydrate(0)

  // Attach some bound inducer factories to the store
  static actors = {
    increment: () => state => state + 1,
    decrement: () => state => state - 1
  }
}


const CounterContext = createContext(CounterApi)


export default CounterContext


// Partially apply the CounterContext.consume() HOC to get a withCounter() HOC.
// All components enhanced by withCounter() will receive a `counterStore` prop.
export const withCounter = CounterContext.consume('counterStore')
