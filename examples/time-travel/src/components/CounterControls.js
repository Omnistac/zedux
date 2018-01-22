import React from 'react'

import { withCounter } from '../providers/CounterProvider'


export default withCounter(CounterControls)


function CounterControls({ counterStore: { increment, decrement } }) {
  return (
    <div className="counter__controls">
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
    </div>
  )
}
