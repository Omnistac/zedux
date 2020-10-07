import React from 'react'
import styled from 'styled-components'
import { Counter } from './counter'

const CountersWrapper = styled.main`
  align-items: center;
  display: flex;
  flex: 1;
  flex-flow: row wrap;
  font-family: helvetica;
  justify-content: center;
  line-height: 1.8;
  text-align: center;
`

export const Counters = () => (
  <CountersWrapper>
    <Counter />
    <Counter />
    <Counter />
  </CountersWrapper>
)
