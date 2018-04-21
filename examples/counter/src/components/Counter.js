import React from 'react'

import CounterContext from '../contexts/CounterContext'
import CounterControls from './CounterControls'
import CounterDisplay from './CounterDisplay'


/*
  A simple Counter component. Provides a CounterContext to its descendants.

  Props:
    parentStore - Zedux Store (optional) - If passed, the provided counter
    store will be attached/detached to/from the parent on mount/unmount
*/
export default function Counter({ parentStore }) {
  return (
    <div className="counter">
      <CounterContext.Provider
        onMount={counterStore => {
          if (parentStore) parentStore.use({ [counterStore.id]: counterStore })
        }}
        onUnmount={counterStore => {
          if (parentStore) parentStore.use({ [counterStore.id]: null })
        }}
      >
        <CounterDisplay />
        <CounterControls />
      </CounterContext.Provider>
    </div>
  )
}
