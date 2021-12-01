import { AnyAtomInstanceBase, useAtomSelector } from '@zedux/react'
import React, { useEffect, useMemo, useState } from 'react'
import { getCurrentEcosystemWrapperInstance } from '../../atoms/ecosystemWrapper'
import { eventMap } from './Event'
import { Controls } from '../GlobalControls'
import { Details } from './Details'
import {
  getAtomFilter,
  getAtomFlagsFilter,
  getAtomInstanceFilter,
  getAtomInstanceActiveStateFilter,
  getAtomInstanceKeyHashFilter,
  getSelectedLogEvent,
  selectedLogEventIdContext,
} from '../../atoms/stateHub'
import { ListScreenList, ListScreen, SplitScreen } from '../../styles'

export const Log = () => {
  const instance = useAtomSelector(getCurrentEcosystemWrapperInstance)
  const selectedLogEvent = useAtomSelector(getSelectedLogEvent)
  const [log, setLog] = useState(instance.store.getState().log)

  const atomFilter = useAtomSelector(getAtomFilter)
  const atomFlagsFilter = useAtomSelector(getAtomFlagsFilter)
  const atomInstanceFilter = useAtomSelector(getAtomInstanceFilter)
  const atomInstanceActiveStateFilter = useAtomSelector(
    getAtomInstanceActiveStateFilter
  )
  const atomInstanceKeyHashFilter = useAtomSelector(
    getAtomInstanceKeyHashFilter
  )

  useEffect(() => {
    let isCurrent = true
    const subscription = instance.store.subscribe((newState, oldState) => {
      if (newState.log === oldState?.log) return

      // defer setting the log to prevent state-update-during-render when
      // inspecting the state of the StateHub itself
      setTimeout(() => {
        if (isCurrent) setLog(newState.log)
      })
    })

    setLog(instance.store.getState().log)

    return () => {
      subscription.unsubscribe()
      isCurrent = false
    }
  }, [instance])

  const filteredLog = useMemo(() => {
    // if no filters are selected, everything passes
    if (
      !atomFilter?.length &&
      !atomFlagsFilter?.length &&
      !atomInstanceActiveStateFilter?.length &&
      !atomInstanceFilter?.length &&
      !atomInstanceKeyHashFilter?.length
    ) {
      return log
    }

    const instancePasses = (instance: AnyAtomInstanceBase) => {
      const passesActiveStateFilter =
        !atomInstanceActiveStateFilter?.length ||
        atomInstanceActiveStateFilter.includes(instance._activeState)

      if (
        !atomFilter?.length &&
        !atomFlagsFilter?.length &&
        !atomInstanceFilter?.length &&
        !atomInstanceKeyHashFilter?.length
      ) {
        return passesActiveStateFilter
      }

      return (
        (atomFilter?.includes(instance.atom.key) ||
          atomFlagsFilter?.some(flag => instance.atom.flags?.includes(flag)) ||
          atomInstanceFilter?.includes(instance.keyHash) ||
          atomInstanceKeyHashFilter?.some(partialKeyHash =>
            instance.keyHash
              .toLowerCase()
              .includes(partialKeyHash.toLowerCase())
          )) &&
        passesActiveStateFilter
      )
    }

    return log.filter(event => {
      switch (event.action.type) {
        case 'edgeCreated':
        case 'edgeRemoved': {
          const { dependency, dependent } = event.action.payload
          return (
            instancePasses(dependency) ||
            (typeof dependent !== 'string' && instancePasses(dependent))
          )
        }
        case 'ghostEdgeCreated':
        case 'ghostEdgeDestroyed': {
          const { dependency } = event.action.payload.ghost
          return instancePasses(dependency)
        }
        case 'instanceActiveStateChanged':
        case 'instanceStateChanged': {
          const { instance } = event.action.payload
          return instancePasses(instance)
        }
        default:
          return false // filter out all other events
      }
    })
  }, [
    atomFilter,
    atomFlagsFilter,
    atomInstanceFilter,
    atomInstanceActiveStateFilter,
    atomInstanceKeyHashFilter,
    log,
  ])

  return (
    <selectedLogEventIdContext.Provider value={selectedLogEvent?.id || ''}>
      <SplitScreen>
        <ListScreen>
          <Controls />
          <ListScreenList>
            {filteredLog.map(event => {
              const EventComponent = eventMap[event.action.type]

              return <EventComponent event={event} key={event.id} />
            })}
          </ListScreenList>
        </ListScreen>
        <Details event={selectedLogEvent} />
      </SplitScreen>
    </selectedLogEventIdContext.Provider>
  )
}
