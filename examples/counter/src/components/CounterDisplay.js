import React from 'react'

import { withCounter } from '../contexts/CounterContext'

export default withCounter(CounterDisplay)


function CounterDisplay({ counterStore: { state } }) {
  return (
    <p className="counter__display">Counter value: {state}</p>
  )
}
