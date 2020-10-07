import React, { useContext, useCallback } from 'react'
import styled from 'styled-components'
import { CounterContext } from './counter.context'

const CounterControlsWrapper = styled.div`
  display: flex;
`

const Button = styled.button`
  background: ${({ theme }) => theme.main};
  border: none;
  color: #fff;
  cursor: pointer;
  flex: 1;
  font-size: 24rem;
  outline: none;
  padding: 12px;

  &:hover {
    background: ${({ theme }) => theme.mainDark};
  }

  &:nth-child(n + 2) {
    margin-left: 16px;
  }
`

export const CounterControls = () => {
  const store = useContext(CounterContext)
  const increment = useCallback(() => store.setState(state => state + 1), [
    store,
  ])
  const decrement = useCallback(() => store.setState(state => state - 1), [
    store,
  ])

  return (
    <CounterControlsWrapper>
      <Button onClick={increment}>Increment</Button>
      <Button onClick={decrement}>Decrement</Button>
    </CounterControlsWrapper>
  )
}
