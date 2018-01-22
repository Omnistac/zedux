import React, { Component, Fragment } from 'react'
import { render } from 'react-dom'
import { Provider, act, createStore, react, withStores } from 'react-zedux'

import Counter from './components/Counter'
import RootProvider from './providers/RootProvider'


export default function App() {
  return (
    <RootProvider>
      <Counter />
      <Counter />
      <Counter />
    </RootProvider>
  )
}
