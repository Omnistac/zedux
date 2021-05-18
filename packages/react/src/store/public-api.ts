import { ecosystem } from '../factories/ecosystem'
import { globalStore, wipe as wipeAction } from './'

export const getEcosystem = (id: string) => {
  const existingEcosystem = globalStore.getState().ecosystems[id]

  return existingEcosystem || ecosystem({ id })
}

export const wipe = () => globalStore.dispatch(wipeAction())

export const zeduxStore = globalStore
