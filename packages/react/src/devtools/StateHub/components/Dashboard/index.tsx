import { useAtomSelector } from '@zedux/react'
import React from 'react'
import {
  getCurrentEcosystemWrapper,
  getNumEvents,
  getNumUpdates,
} from '../../atoms/ecosystemWrapper'
import styled from '@zedux/react/ssc'

const BigNumber = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 4em;
`

const Cell = styled.div`
  align-content: center;
  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 3fr 2fr 2fr;
  height: 100%;
`

const Number = styled.span`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 2.5em;
`

const Text = styled.span`
  font-size: 1.2em;
  margin: 0;
  white-space: nowrap;
`

export const Dashboard = () => {
  const instances = useAtomSelector(
    ({ select }) => select(getCurrentEcosystemWrapper).instances
  )
  const numEvents = useAtomSelector(getNumEvents)
  const numUpdates = useAtomSelector(getNumUpdates)

  return (
    <Grid>
      <Cell>
        <BigNumber>{Object.keys(instances).length}</BigNumber>
        <Text>Atom Instances</Text>
      </Cell>
      <Cell>
        <BigNumber>{numUpdates}</BigNumber>
        <Text>Total Updates</Text>
      </Cell>
      <Cell>
        <BigNumber>{numEvents}</BigNumber>
        <Text>Total Events</Text>
      </Cell>
    </Grid>
  )
}
