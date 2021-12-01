import { AtomGetters } from '@zedux/react'
import { createContext } from 'react'
import { GlobalFilter } from '../../types'
import {
  ecosystemAtomInstance,
  getCurrentEcosystemWrapper,
} from '../ecosystemWrapper'
import { stateHub } from './atom'

export const getAtomFilter = ({ get }: AtomGetters) =>
  get(stateHub).filters[get(stateHub).ecosystemId]?.[GlobalFilter.Atom]

export const getAtomFlagsFilter = ({ get }: AtomGetters) =>
  get(stateHub).filters[get(stateHub).ecosystemId]?.[GlobalFilter.AtomFlags]

export const getAtomInstanceFilter = ({ get }: AtomGetters) =>
  get(stateHub).filters[get(stateHub).ecosystemId]?.[GlobalFilter.AtomInstance]

export const getAtomInstanceActiveStateFilter = ({ get }: AtomGetters) =>
  get(stateHub).filters[get(stateHub).ecosystemId]?.[
    GlobalFilter.AtomInstanceActiveState
  ]

export const getAtomInstanceKeyHashFilter = ({ get }: AtomGetters) =>
  get(stateHub).filters[get(stateHub).ecosystemId]?.[
    GlobalFilter.AtomInstanceKeyHash
  ]

export const getSelectedAtomInstance = ({ get, select }: AtomGetters) => {
  const keyHash = select(getSelectedAtomInstanceKeyHash)

  if (!keyHash) return

  return get(ecosystemAtomInstance, [keyHash])
}

export const getSelectedAtomInstanceKeyHash = ({ get }: AtomGetters) =>
  get(stateHub).selectedAtomInstanceKeyHash

export const getSelectedLogEvent = ({ select }: AtomGetters) => {
  const selectedLogEventId = select(getSelectedLogEventId)

  if (!selectedLogEventId) return

  return select(getCurrentEcosystemWrapper).log.find(
    event => event.id === selectedLogEventId
  )
}

export const getSelectedLogEventId = ({ get }: AtomGetters) =>
  get(stateHub).selectedLogEventId

// have to use context for this otherwise inspecting the StateHub ecosystem
// state causes infinite loop of edge creations and log events
export const selectedLogEventIdContext = createContext('')
