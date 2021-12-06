import { AtomGetters, AtomSelectorConfig } from '@zedux/react'
import { createContext } from 'react'
import { defaultColors } from '../../styles'
import { GlobalFilter, LogFilter, Route } from '../../types'
import {
  ecosystemAtomInstance,
  getCurrentEcosystemWrapper,
} from '../ecosystemWrapper'
import { stateHub, StateHubState } from './atom'

export const getAtomFilter = ({ get }: AtomGetters) =>
  get(stateHub).ecosystemConfig[get(stateHub).ecosystemId]?.filters?.[
    GlobalFilter.Atom
  ]

export const getAtomFlagsFilter = ({ get }: AtomGetters) =>
  get(stateHub).ecosystemConfig[get(stateHub).ecosystemId]?.filters?.[
    GlobalFilter.AtomFlags
  ]

export const getAtomInstanceFilter = ({ get }: AtomGetters) =>
  get(stateHub).ecosystemConfig[get(stateHub).ecosystemId]?.filters?.[
    GlobalFilter.AtomInstance
  ]

export const getAtomInstanceActiveStateFilter = ({ get }: AtomGetters) =>
  get(stateHub).ecosystemConfig[get(stateHub).ecosystemId]?.filters?.[
    GlobalFilter.AtomInstanceActiveState
  ]

export const getAtomInstanceKeyHashFilter = ({ get }: AtomGetters) =>
  get(stateHub).ecosystemConfig[get(stateHub).ecosystemId]?.filters?.[
    GlobalFilter.AtomInstanceKeyHash
  ]

export const getColors = ({ get }: AtomGetters) => ({
  ...defaultColors,
  ...get(stateHub).ecosystemConfig[get(stateHub).ecosystemId]?.colors,
})

export const getFlags: AtomSelectorConfig<
  Pick<StateHubState, 'isPersistingToLocalStorage' | 'isWatchingStateHub'>
> = {
  resultsAreEqual: (newResult, oldResult) =>
    Object.entries(newResult).every(
      ([key, val]) => val === oldResult[key as keyof typeof oldResult]
    ),
  selector: ({ get }) => {
    const { isPersistingToLocalStorage, isWatchingStateHub } = get(stateHub)
    return { isPersistingToLocalStorage, isWatchingStateHub }
  },
}

export const getLoggingMode = (
  { get }: AtomGetters,
  keyHash?: string,
  ecosystemId = get(stateHub).ecosystemId
) =>
  keyHash &&
  get(stateHub).ecosystemConfig[ecosystemId]?.instanceConfig?.[keyHash]
    ?.loggingMode

export const getIsOpen = ({ get }: AtomGetters) => get(stateHub).isOpen

export const getLogEdgeTypeFilter = ({ get }: AtomGetters) =>
  get(stateHub).ecosystemConfig[get(stateHub).ecosystemId]?.logFilters?.[
    LogFilter.EdgeType
  ] || {}

export const getLogEventTypeFilter = ({ get }: AtomGetters) =>
  get(stateHub).ecosystemConfig[get(stateHub).ecosystemId]?.logFilters?.[
    LogFilter.EventType
  ]

export const getLogLimit = (
  { get }: AtomGetters,
  ecosystemId = get(stateHub).ecosystemId
) => get(stateHub).ecosystemConfig[ecosystemId]?.logLimit || 2000

export const getPosition = ({ get }: AtomGetters) => get(stateHub).position

export const getSelectedAtomInstance = ({ get, select }: AtomGetters) => {
  const keyHash = select(getSelectedAtomInstanceKeyHash)

  if (!keyHash) return

  return get(ecosystemAtomInstance, [keyHash])
}

export const getSelectedAtomInstanceKeyHash = ({ get }: AtomGetters) =>
  get(stateHub).ecosystemConfig[get(stateHub).ecosystemId]
    ?.selectedAtomInstanceKeyHash

export const getSelectedLogEvent = ({ select }: AtomGetters) => {
  const selectedLogEventId = select(getSelectedLogEventId)

  if (!selectedLogEventId) return

  return select(getCurrentEcosystemWrapper).log.find(
    event => event.id === selectedLogEventId
  )
}

export const getSelectedLogEventId = ({ get }: AtomGetters) =>
  get(stateHub).ecosystemConfig[get(stateHub).ecosystemId]?.selectedLogEventId

export const getRoute = ({ get }: AtomGetters) =>
  get(stateHub).ecosystemConfig[get(stateHub).ecosystemId]?.route ||
  Route.Dashboard

// have to use context for this otherwise inspecting the StateHub ecosystem
// state causes infinite loop of edge creations and log events
export const selectedLogEventIdContext = createContext('')
