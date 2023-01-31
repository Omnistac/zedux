import { Ecosystem } from '../classes'
import { globalStore, wipe as wipeAction } from './'

export const getEcosystem = (id: string): Ecosystem | undefined => {
  const ecosystem = globalStore.getState().ecosystems[id]

  if (ecosystem) return ecosystem
}

export const wipe = () => {
  const ecosystems = Object.values(globalStore.getState().ecosystems)

  ecosystems.forEach(es => {
    es.destroy(true)
  })

  globalStore.dispatch(wipeAction())
}

export const internalStore = globalStore
