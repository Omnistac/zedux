import {
  Mod,
  useAtomInstance,
  useAtomSelector,
  ZeduxPlugin,
} from '@zedux/react'
import styled from '@zedux/react/ssc'
import React from 'react'
import {
  getLogEdgeTypeFilter,
  getLogEventTypeFilter,
  stateHub,
} from '../../../atoms/stateHub'
import { Badge, MultiSelect, Select } from '../../../styles'
import { LogFilter, RectType } from '../../../types'
import { globalFilterMap } from '../../GlobalControls/GlobalFilter'

const Description = styled.span`
  align-self: center;
  display: ${({ theme }) => (theme.width <= RectType.Md ? 'none' : 'inline')};
  font-size: 0.9em;
`

const Faded = styled.span`
  color: #888;
`

const Grid = styled.div`
  column-gap: 0.5em;
  display: grid;
  grid-template-columns: auto auto auto auto;
  justify-content: start;
  min-height: 2.7em;
`

const EdgeType = () => {
  const stateHubInstance = useAtomInstance(stateHub)
  const { isExplicit, isExternal, isStatic } = useAtomSelector(
    getLogEdgeTypeFilter
  )

  return (
    <Grid>
      <Description>Filter Edge-Related Events By Edge Type</Description>
      <Select
        onSelect={id => {
          stateHubInstance.exports.setLogFilter(LogFilter.EdgeType, () => ({
            isExplicit: id === 'either' ? undefined : id === 'explicit',
          }))
        }}
        options={{
          either: <Faded>either</Faded>,
          explicit: <Badge variant="secondary">explicit</Badge>,
          implicit: <Badge>implicit</Badge>,
        }}
        order={['implicit', 'either', 'explicit']}
        selected={
          typeof isExplicit === 'undefined'
            ? 'either'
            : isExplicit
            ? 'explicit'
            : 'implicit'
        }
        width="5.5em"
      />
      <Select
        onSelect={id => {
          stateHubInstance.exports.setLogFilter(LogFilter.EdgeType, () => ({
            isExternal: id === 'either' ? undefined : id === 'external',
          }))
        }}
        options={{
          either: <Faded>either</Faded>,
          external: <Badge variant="secondary">external</Badge>,
          internal: <Badge>internal</Badge>,
        }}
        order={['internal', 'either', 'external']}
        selected={
          typeof isExternal === 'undefined'
            ? 'either'
            : isExternal
            ? 'external'
            : 'internal'
        }
        width="5.5em"
      />
      <Select
        onSelect={id => {
          stateHubInstance.exports.setLogFilter(LogFilter.EdgeType, () => ({
            isStatic: id === 'either' ? undefined : id === 'static',
          }))
        }}
        options={{
          either: <Faded>either</Faded>,
          static: <Badge variant="secondary">static</Badge>,
          dynamic: <Badge>dynamic</Badge>,
        }}
        order={['dynamic', 'either', 'static']}
        selected={
          typeof isStatic === 'undefined'
            ? 'either'
            : isStatic
            ? 'static'
            : 'dynamic'
        }
        width="5.5em"
      />
    </Grid>
  )
}

const eventTypeOptions = Object.keys(ZeduxPlugin.actions).reduce((obj, key) => {
  obj[key] = key
  return obj
}, {} as Record<string, string>)

const EventType = () => {
  const stateHubInstance = useAtomInstance(stateHub)

  const selected = useAtomSelector(getLogEventTypeFilter) || []

  return (
    <MultiSelect
      emptyText="No More Event Types"
      onDeselect={id => {
        stateHubInstance.exports.setLogFilter(
          LogFilter.EventType,
          (state = []) => state.filter(selectedId => selectedId !== id)
        )
      }}
      onSelect={id => {
        stateHubInstance.exports.setLogFilter(
          LogFilter.EventType,
          (state = []) => [...state, id as Mod]
        )
      }}
      options={eventTypeOptions}
      placeholder="Filter By Event Type"
      selected={selected}
    />
  )
}

export const filterMap = {
  ...globalFilterMap,
  [LogFilter.EdgeType]: EdgeType,
  [LogFilter.EventType]: EventType,
}
