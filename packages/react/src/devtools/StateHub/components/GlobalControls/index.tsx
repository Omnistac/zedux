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
  DoubleIcon,
  ControlGroup,
  ControlButton,
  styledIcons,
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
      <DoubleIcon
        iconOne={styledIcons.World}
        iconTwo={styledIcons.Filter}
        inverted
      />
      <ControlButton
        isActive={selectedFilter === GlobalFilter.Atom}
        numSelected={atomFilter?.length}
        onClick={() =>
          setSelectedFilter(state =>
            state === GlobalFilter.Atom ? undefined : GlobalFilter.Atom
          )
        }
      >
        <styledIcons.Atom />
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
        <styledIcons.AtomInstance />
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
        <styledIcons.Key />
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
        <styledIcons.Flag />
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
        <styledIcons.Cycle />
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


sort by:

on atoms page:
- most updated
- recently updated
- name
- time created
*/
