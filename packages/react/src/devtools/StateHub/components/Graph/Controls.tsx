import React, { useState } from 'react'
import { ControlGrid, ControlList, ControlSelected } from '../../styles'
import { GlobalFilter } from '../../types'
import { GlobalControls } from '../GlobalControls'
import { globalFilterMap } from '../GlobalControls/GlobalFilter'

export const Controls = () => {
  const [selectedFilter, setSelectedFilter] = useState<
    GlobalFilter | undefined
  >()

  const FilterComponent = selectedFilter && globalFilterMap[selectedFilter]

  return (
    <ControlGrid>
      <ControlList>
        <GlobalControls
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
        />
      </ControlList>
      {FilterComponent && (
        <ControlSelected>
          <FilterComponent />
        </ControlSelected>
      )}
    </ControlGrid>
  )
}
