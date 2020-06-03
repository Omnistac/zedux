import { createStore } from '@zedux'
import React, { useMemo } from 'react'
import styled from 'styled-components'
import { Counter } from '../counters/counter'
import { withLogger } from './withLogger'

const Wrapper = styled.div`
  display: flex;
`

export const HigherOrderStore = () => {
  const store = useMemo(() => withLogger(createStore()), [])

  return (
    <Wrapper>
      <Counter parentStore={store} />
    </Wrapper>
  )
}
