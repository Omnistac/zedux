import React from 'react'
import styled from '../simple-styled-components'
import { EcosystemSelector } from './EcosystemSelector'
import { PositionControls } from './PositionControls'
import { SizeControls } from './SizeControls'

const StyledHeader = styled.header`
  align-items: stretch;
  display: flex;
  flex-flow: row nowrap;
`

const Text = styled.span`
  align-items: center;
  display: flex;
  flex: 1;
  font-size: 1.4em;
  padding: 0 0.5em;
  white-space: nowrap;
`

export const Header = () => {
  return (
    <StyledHeader>
      <Text>Zedux State Hub</Text>
      <EcosystemSelector />
      <SizeControls />
      <PositionControls />
    </StyledHeader>
  )
}
