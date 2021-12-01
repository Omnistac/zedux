import { useAtomSelector, useAtomValue } from '@zedux/react'
import React from 'react'
import { rect } from '../../atoms/rect'
import { stateHub } from '../../atoms/stateHub'
import styled from '@zedux/react/ssc'
import { RectType } from '../../types'
import { EcosystemSelector } from './EcosystemSelector'
import { PositionControls } from './PositionControls'
import { SizeControls } from './SizeControls'
import { HistoryControls } from './HistoryControls'

const StyledHeader = styled.header`
  align-items: stretch;
  box-shadow: 0 1px ${({ theme }) => theme.colors.primary};
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
  const route = useAtomSelector(({ get }) => get(stateHub).route)
  const { width } = useAtomValue(rect)

  return (
    <StyledHeader>
      <HistoryControls />
      <Text>
        {width > RectType.Sm ? 'Zedux State Hub - ' : ''}
        {route}
      </Text>
      <EcosystemSelector />
      <SizeControls />
      <PositionControls />
    </StyledHeader>
  )
}
