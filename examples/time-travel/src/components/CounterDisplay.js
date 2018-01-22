import React from 'react'

import { withCounter } from '../providers/CounterProvider'

export default withCounter(CounterDisplay)


function CounterDisplay({ counterStore: { state } }) {
  return (
    <p className="counter__display">Counter value: {state}</p>
  )
}
