import React from 'react'

import CounterProvider from '../providers/CounterProvider'
import CounterControls from './CounterControls'
import CounterDisplay from './CounterDisplay'


export default function Counter() {
  return (
    <div className="counter">
      <CounterProvider>
        <CounterDisplay />
        <CounterControls />
      </CounterProvider>
    </div>
  )
}
