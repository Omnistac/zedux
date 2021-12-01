import { useAtomSelector } from '@zedux/react'
import styled from '@zedux/react/ssc'
import React, { useState } from 'react'
import {
  getAtomFilter,
  getAtomFlagsFilter,
  getAtomInstanceFilter,
  getAtomInstanceActiveStateFilter,
  getAtomInstanceKeyHashFilter,
} from '../../atoms/stateHub'
import {
  FilterIcon,
  IconAtom,
  IconAtomInstance,
  IconFlag,
  IconCycle,
  IconKey,
  WorldIcon,
  SupBadge,
} from '../../styles'
import { GlobalFilter } from '../../types'
import { filterMap } from './Filter'

const DoubleIconGrid = styled.div`
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  padding: 0.3em;
`

const DoubleIconOne = styled.div`
  grid-column: 1 / span 3;
  grid-row: 1 / span 3;
  height: 1em;
  width: 1em;
`

const DoubleIconTwo = styled.div`
  filter: ${({ theme }) =>
    Array(3).fill(`drop-shadow(0 0 1px ${theme.colors.primary})`).join(' ')};
  grid-column: 2 / span 3;
  grid-row: 2 / span 3;
  height: 1.1em;
  width: 1.1em;
`

const FilterButton = styled.button<{ isActive: boolean }>`
  align-items: center;
  appearance: none;
  background: ${({ isActive, theme }) =>
    isActive ? theme.colors.alphas.primary[2] : theme.colors.alphas.white[0]};
  border: none;
  cursor: pointer;
  display: grid;
  padding: 0.4em;
  position: relative;

  &:hover {
    background: ${({ theme }) => theme.colors.alphas.white[1]};
  }
`

const FilterGroup = styled.div`
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
  grid-template-rows: minmax(0, 1fr);
`

const FiltersGrid = styled.div`
  column-gap: 0.5em;
  display: grid;
  grid-template-columns: auto auto;
  justify-content: start;
  justify-items: start;
`

const FilterWrapper = styled.div`
  padding-bottom: 0.5em;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto;
  row-gap: 0.5em;
`

const StyledFilterIcon = styled(FilterIcon)`
  color: ${({ theme }) => theme.colors.background};
  height: 100%;
  width: 100%;
`

const StyledWorldIcon = styled(WorldIcon)`
  color: ${({ theme }) => theme.colors.background};
  height: 100%;
  width: 100%;
`

export const Controls = () => {
  const [selectedFilter, setSelectedFilter] = useState<
    GlobalFilter | undefined
  >()

  const atomFilter = useAtomSelector(getAtomFilter)
  const atomFlagsFilter = useAtomSelector(getAtomFlagsFilter)
  const atomInstanceFilter = useAtomSelector(getAtomInstanceFilter)
  const atomInstanceActiveStateFilter = useAtomSelector(
    getAtomInstanceActiveStateFilter
  )
  const atomInstanceKeyHashFilter = useAtomSelector(
    getAtomInstanceKeyHashFilter
  )

  const FilterComponent = selectedFilter && filterMap[selectedFilter]

  return (
    <Grid>
      <FiltersGrid>
        <FilterGroup>
          <DoubleIconGrid>
            <DoubleIconOne>
              <StyledWorldIcon />
            </DoubleIconOne>
            <DoubleIconTwo>
              <StyledFilterIcon />
            </DoubleIconTwo>
          </DoubleIconGrid>
          <FilterButton
            isActive={selectedFilter === GlobalFilter.Atom}
            onClick={() =>
              setSelectedFilter(state =>
                state === GlobalFilter.Atom ? undefined : GlobalFilter.Atom
              )
            }
          >
            <IconAtom />
            {atomFilter?.length ? (
              <SupBadge>{atomFilter.length}</SupBadge>
            ) : null}
          </FilterButton>
          <FilterButton
            isActive={selectedFilter === GlobalFilter.AtomInstance}
            onClick={() =>
              setSelectedFilter(state =>
                state === GlobalFilter.AtomInstance
                  ? undefined
                  : GlobalFilter.AtomInstance
              )
            }
          >
            <IconAtomInstance />
            {atomInstanceFilter?.length ? (
              <SupBadge>{atomInstanceFilter.length}</SupBadge>
            ) : null}
          </FilterButton>
          <FilterButton
            isActive={selectedFilter === GlobalFilter.AtomInstanceKeyHash}
            onClick={() =>
              setSelectedFilter(state =>
                state === GlobalFilter.AtomInstanceKeyHash
                  ? undefined
                  : GlobalFilter.AtomInstanceKeyHash
              )
            }
          >
            <IconKey />
            {atomInstanceKeyHashFilter?.length ? (
              <SupBadge>{atomInstanceKeyHashFilter.length}</SupBadge>
            ) : null}
          </FilterButton>
          <FilterButton
            isActive={selectedFilter === GlobalFilter.AtomFlags}
            onClick={() =>
              setSelectedFilter(state =>
                state === GlobalFilter.AtomFlags
                  ? undefined
                  : GlobalFilter.AtomFlags
              )
            }
          >
            <IconFlag />
            {atomFlagsFilter?.length ? (
              <SupBadge>{atomFlagsFilter.length}</SupBadge>
            ) : null}
          </FilterButton>
          <FilterButton
            isActive={selectedFilter === GlobalFilter.AtomInstanceActiveState}
            onClick={() =>
              setSelectedFilter(state =>
                state === GlobalFilter.AtomInstanceActiveState
                  ? undefined
                  : GlobalFilter.AtomInstanceActiveState
              )
            }
          >
            <IconCycle />
            {atomInstanceActiveStateFilter?.length ? (
              <SupBadge>{atomInstanceActiveStateFilter.length}</SupBadge>
            ) : null}
          </FilterButton>
        </FilterGroup>
        <FilterGroup></FilterGroup>
      </FiltersGrid>
      {FilterComponent && (
        <FilterWrapper>
          <FilterComponent />
        </FilterWrapper>
      )}
    </Grid>
  )
}

/*
filter categories:
- atom instance atom flags
- atom instance exact atom
- atom instance keyHash match
- exact atom instance
- active state

on log page:
- event type
- active state changed to

on atoms page:
- (nothing! Everything on this page defines the global filter categories)

on graph page:
- whether to show ghost edges


sort by:

on atoms page:
- most updated
- recently updated
- name
- time created
*/
