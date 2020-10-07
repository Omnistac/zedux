import { createStore } from '@zedux'
import React, { useMemo } from 'react'
import styled from 'styled-components'
import { withDevTools } from './withDevTools'

const Wrapper = styled.div`
  display: flex;
`

export const TimeTravel = () => {
  const store = useMemo(() => createStore(), [])
  const wrappedStore = useMemo(() => withDevTools(store), [store])

  return (
    <Wrapper>
      <p>Work In Progress</p>
    </Wrapper>
  )
}
