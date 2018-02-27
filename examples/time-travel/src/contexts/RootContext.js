import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { createContext } from 'react-zedux'
import { createStore } from 'zedux'

import withDevTools from '../withDevTools'


const RootContext = createContext(
  withDevTools(createStore())
)


export default RootContext


// Partially apply the RootContext.consume() HOC to get a withRoot() HOC.
// All components enhanced by withRoot() will receive a `rootStore` prop.
export const withRoot = RootContext.consume('rootStore')
