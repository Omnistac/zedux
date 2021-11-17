import React from 'react'
import styled from 'styled-components'
import { PositionControls } from './PositionControls'
import { SizeControls } from './SizeControls'

const StyledHeader = styled.header`
  align-items: stretch;
  display: flex;
  flex-flow: row nowrap;
`

const Text = styled.span`
  flex: 1;
  font-size: 1.4em;
  padding-left: 1em;
`

export const Header = () => {
  return (
    <StyledHeader>
      <Text>Zedux State Hub</Text>
      <SizeControls />
      <PositionControls />
    </StyledHeader>
  )
}
