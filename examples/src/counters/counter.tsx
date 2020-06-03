import { createStore, Store } from '@zedux'
import React, { useMemo, FC } from 'react'
import styled from 'styled-components'
import { CounterContext } from './counter.context'
import { CounterControls } from './counter-controls'
import { CounterDisplay } from './counter-display'

interface Props {
  parentStore?: Store
}

const CounterWrapper = styled.div`
  background: #f7f7f7;
  flex: 1;
  margin: 20px;
  padding: 15px;
`

export const Counter: FC<Props> = ({ parentStore }) => {
  const store = useMemo(() => {
    const childStore = createStore().hydrate(0)

    return parentStore ? parentStore.use(childStore) : childStore
  }, [parentStore])

  return (
    <CounterWrapper>
      <CounterContext.Provider value={store}>
        <CounterDisplay />
        <CounterControls />
      </CounterContext.Provider>
    </CounterWrapper>
  )
}
