import { useAtomSelector, useAtomValue, useEcosystem } from '@zedux/react'
import React, { useMemo } from 'react'
import { Controls } from './Controls'
import { Details } from './Details'
import {
  getAtomFilter,
  getAtomFlagsFilter,
  getAtomInstanceFilter,
  getAtomInstanceActiveStateFilter,
  getAtomInstanceKeyHashFilter,
  getSelectedAtomInstance,
  stateHub,
} from '../../atoms/stateHub'
import {
  ListScreenList,
  ListScreen,
  SplitScreen,
  ListScreenItem,
  IconButton,
  Title,
  styledIcons,
} from '../../styles'
import { ecosystemAtomInstances } from '../../atoms/ecosystemWrapper'
import { logAtomInstance } from '../../utils/logging'

export const Atoms = () => {
  const ecosystem = useEcosystem()
  const instances = useAtomValue(ecosystemAtomInstances)
  const selectedAtomInstance = useAtomSelector(getSelectedAtomInstance)

  const atomFilter = useAtomSelector(getAtomFilter)
  const atomFlagsFilter = useAtomSelector(getAtomFlagsFilter)
  const atomInstanceFilter = useAtomSelector(getAtomInstanceFilter)
  const atomInstanceActiveStateFilter = useAtomSelector(
    getAtomInstanceActiveStateFilter
  )
  const atomInstanceKeyHashFilter = useAtomSelector(
    getAtomInstanceKeyHashFilter
  )

  const filteredInstances = useMemo(() => {
    // if no filters are selected, everything passes
    if (
      !atomFilter?.length &&
      !atomFlagsFilter?.length &&
      !atomInstanceFilter?.length &&
      !atomInstanceKeyHashFilter?.length
    ) {
      if (!atomInstanceActiveStateFilter?.length) return instances

      // if ActiveState is the only filter, handle it separately (it's the only
      // AND-ed filter, so handling it later would need to do this exact same
      // check to see whether any other filters exist. So just do it here since
      // we already checked the other filters)
      return instances.filter(instance =>
        atomInstanceActiveStateFilter.includes(instance._activeState)
      )
    }

    return instances.filter(
      instance =>
        (atomFilter?.includes(instance.atom.key) ||
          atomFlagsFilter?.some(flag => instance.atom.flags?.includes(flag)) ||
          atomInstanceFilter?.includes(instance.keyHash) ||
          atomInstanceKeyHashFilter?.some(partialKeyHash =>
            instance.keyHash
              .toLowerCase()
              .includes(partialKeyHash.toLowerCase())
          )) &&
        (!atomInstanceActiveStateFilter?.length ||
          atomInstanceActiveStateFilter.includes(instance._activeState))
    )
  }, [
    atomFilter,
    atomFlagsFilter,
    atomInstanceFilter,
    atomInstanceActiveStateFilter,
    atomInstanceKeyHashFilter,
    instances,
  ])

  return (
    <SplitScreen>
      <ListScreen>
        <Controls />
        <ListScreenList>
          {filteredInstances.map(instance => (
            <ListScreenItem
              actions={
                <IconButton
                  onClick={() =>
                    logAtomInstance(instance, instance.store.getState())
                  }
                >
                  <styledIcons.Log />
                </IconButton>
              }
              isActive={
                instance.keyHash === selectedAtomInstance?.instance.keyHash
              }
              key={instance.keyHash}
              onClick={() => {
                ecosystem
                  .getInstance(stateHub)
                  .exports.setSelectedAtomInstance(keyHash =>
                    keyHash === instance.keyHash ? undefined : instance.keyHash
                  )
              }}
              preview={
                <>
                  <Title>{instance.keyHash}</Title>
                </>
              }
            />
          ))}
        </ListScreenList>
      </ListScreen>
      <Details snapshot={selectedAtomInstance} />
    </SplitScreen>
  )
}

/*
actions to add:
- toggle time travel
- toggle logging
- toggle atom filter
- toggle atom instance filter
- force destroy
- log graph
*/
