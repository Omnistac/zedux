import { ecosystem } from '../factories/ecosystem'
import { globalStore, wipe as wipeAction } from './'

export const getEcosystem = (id: string) => {
  const existingEcosystem = globalStore.getState().ecosystems[id]

  return existingEcosystem || ecosystem({ id })
}

export const wipe = () => {
  const ecosystems = Object.values(globalStore.getState().ecosystems)

  ecosystems.forEach(es => {
    es.destroy(true)
  })

  globalStore.dispatch(wipeAction())
}

export const zeduxGlobalStore = globalStore
