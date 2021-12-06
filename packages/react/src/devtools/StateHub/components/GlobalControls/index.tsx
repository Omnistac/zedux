import { useAtomSelector } from '@zedux/react'
import React, { FC } from 'react'
import {
  getAtomFilter,
  getAtomFlagsFilter,
  getAtomInstanceFilter,
  getAtomInstanceActiveStateFilter,
  getAtomInstanceKeyHashFilter,
} from '../../atoms/stateHub'
import {
  IconAtom,
  IconAtomInstance,
  IconFilter,
  IconFlag,
  IconCycle,
  IconKey,
  IconWorld,
  DoubleIcon,
  ControlGroup,
  ControlButton,
} from '../../styles'
import { GlobalFilter } from '../../types'

export const GlobalControls: FC<{
  selectedFilter?: string
  setSelectedFilter: (
    setState: (state?: string) => GlobalFilter | undefined
  ) => void
}> = ({ selectedFilter, setSelectedFilter }) => {
  const atomFilter = useAtomSelector(getAtomFilter)
  const atomFlagsFilter = useAtomSelector(getAtomFlagsFilter)
  const atomInstanceFilter = useAtomSelector(getAtomInstanceFilter)
  const atomInstanceActiveStateFilter = useAtomSelector(
    getAtomInstanceActiveStateFilter
  )
  const atomInstanceKeyHashFilter = useAtomSelector(
    getAtomInstanceKeyHashFilter
  )

  return (
    <ControlGroup>
      <DoubleIcon iconOne={IconWorld} iconTwo={IconFilter} inverted />
      <ControlButton
        isActive={selectedFilter === GlobalFilter.Atom}
        numSelected={atomFilter?.length}
        onClick={() =>
          setSelectedFilter(state =>
            state === GlobalFilter.Atom ? undefined : GlobalFilter.Atom
          )
        }
      >
        <IconAtom />
      </ControlButton>
      <ControlButton
        isActive={selectedFilter === GlobalFilter.AtomInstance}
        numSelected={atomInstanceFilter?.length}
        onClick={() =>
          setSelectedFilter(state =>
            state === GlobalFilter.AtomInstance
              ? undefined
              : GlobalFilter.AtomInstance
          )
        }
      >
        <IconAtomInstance />
      </ControlButton>
      <ControlButton
        isActive={selectedFilter === GlobalFilter.AtomInstanceKeyHash}
        numSelected={atomInstanceKeyHashFilter?.length}
        onClick={() =>
          setSelectedFilter(state =>
            state === GlobalFilter.AtomInstanceKeyHash
              ? undefined
              : GlobalFilter.AtomInstanceKeyHash
          )
        }
      >
        <IconKey />
      </ControlButton>
      <ControlButton
        isActive={selectedFilter === GlobalFilter.AtomFlags}
        numSelected={atomFlagsFilter?.length}
        onClick={() =>
          setSelectedFilter(state =>
            state === GlobalFilter.AtomFlags
              ? undefined
              : GlobalFilter.AtomFlags
          )
        }
      >
        <IconFlag />
      </ControlButton>
      <ControlButton
        isActive={selectedFilter === GlobalFilter.AtomInstanceActiveState}
        numSelected={atomInstanceActiveStateFilter?.length}
        onClick={() =>
          setSelectedFilter(state =>
            state === GlobalFilter.AtomInstanceActiveState
              ? undefined
              : GlobalFilter.AtomInstanceActiveState
          )
        }
      >
        <IconCycle />
      </ControlButton>
    </ControlGroup>
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
