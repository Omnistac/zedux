import { createStore } from '@zedux/core'
import { Ecosystem } from '../classes'

export let internalStore = createStore(null, {} as Record<string, Ecosystem>)

export const getEcosystem = (id: string): Ecosystem | undefined =>
  internalStore.getState()[id]

export const setInternalStore = (newStore: typeof internalStore) =>
  (internalStore = newStore)

export const wipe = () => {
  const ecosystems = Object.values(internalStore.getState().ecosystems)

  ecosystems.forEach(es => {
    es.destroy(true)
  })
}
