import React, { useContext, useState, useEffect } from 'react'
import styled from 'styled-components'
import { CounterContext } from './counter.context'

const CounterDisplayWrapper = styled.p`
  font-size: 32rem;
  white-space: nowrap;
`

export const CounterDisplay = () => {
  const store = useContext(CounterContext)
  const [state, setState] = useState(store.getState())

  useEffect(() => {
    const subscription = store.subscribe(newState => setState(newState))

    return subscription.unsubscribe
  })

  return <CounterDisplayWrapper>Counter value: {state}</CounterDisplayWrapper>
}
