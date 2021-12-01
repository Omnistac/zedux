import { Ecosystem } from '../classes'
import { globalStore, wipe as wipeAction } from './'

export const getEcosystem = (id: string): Ecosystem | undefined => {
  const existingEcosystem = globalStore.getState().ecosystems[id]

  return existingEcosystem
}

export const wipe = () => {
  const ecosystems = Object.values(globalStore.getState().ecosystems)

  ecosystems.forEach(es => {
    es.destroy(true)
  })

  globalStore.dispatch(wipeAction())
}

export const zeduxGlobalStore = globalStore
