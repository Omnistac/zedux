import React, { Component, Fragment } from 'react'
import { render } from 'react-dom'
import { Provider, act, createStore, react, withStores } from 'react-zedux'

import Counter from './components/Counter'
import RootContext from './contexts/RootContext'


export default function App() {
  return (
    <RootContext.Provider>
      <Counter />
      <Counter />
      <Counter />
    </RootContext.Provider>
  )
}
