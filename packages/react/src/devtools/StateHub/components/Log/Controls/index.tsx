import { useAtomSelector } from '@zedux/react'
import React, { useState } from 'react'
import { getCurrentEcosystemWrapperInstance } from '../../../atoms/ecosystemWrapper'
import {
  getLogEdgeTypeFilter,
  getLogEventTypeFilter,
} from '../../../atoms/stateHub'
import {
  ControlGrid,
  ControlList,
  ControlGroup,
  ControlSelected,
  DoubleIcon,
  IconFilter,
  IconList,
  ControlButton,
  IconEdge,
  IconRemoveItem,
  IconButton,
  IconClear,
} from '../../../styles'
import { GlobalFilter, LogFilter } from '../../../types'
import { GlobalControls } from '../../GlobalControls'
import { Count } from './Count'
import { filterMap } from './Filter'

export const Controls = () => {
  const [selectedFilter, setSelectedFilter] = useState<
    GlobalFilter | LogFilter | undefined
  >()

  const edgeTypeFilter = useAtomSelector(getLogEdgeTypeFilter)
  const eventTypeFilter = useAtomSelector(getLogEventTypeFilter)
  const { clearLog } = useAtomSelector(
    getCurrentEcosystemWrapperInstance
  ).exports

  const FilterComponent = selectedFilter && filterMap[selectedFilter]

  return (
    <ControlGrid>
      <ControlList>
        <GlobalControls
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
        />
        <ControlGroup>
          <DoubleIcon iconOne={IconList} iconTwo={IconFilter} inverted />
          <ControlButton
            isActive={selectedFilter === LogFilter.EdgeType}
            numSelected={
              Object.values(edgeTypeFilter).filter(
                val => typeof val !== 'undefined'
              ).length
            }
            onClick={() =>
              setSelectedFilter(state =>
                state === LogFilter.EdgeType ? undefined : LogFilter.EdgeType
              )
            }
          >
            <IconEdge />
          </ControlButton>
          <ControlButton
            isActive={selectedFilter === LogFilter.EventType}
            numSelected={eventTypeFilter?.length}
            onClick={() =>
              setSelectedFilter(state =>
                state === LogFilter.EventType ? undefined : LogFilter.EventType
              )
            }
          >
            <IconRemoveItem />
          </ControlButton>
        </ControlGroup>
        <Count />
        <IconButton onClick={() => clearLog()} padding={0.5}>
          <IconClear />
        </IconButton>
      </ControlList>
      {FilterComponent && (
        <ControlSelected>
          <FilterComponent />
        </ControlSelected>
      )}
    </ControlGrid>
  )
}
