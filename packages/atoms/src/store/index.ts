import { createStore } from '@zedux/core'
import { Ecosystem } from '../classes/Ecosystem'
import { setStack, stack } from '../classes/EvaluationStack'
import { StackItem } from '../utils/index'

export let internalStore = createStore(null, {} as Record<string, Ecosystem>)

export const getEcosystem = (id: string): Ecosystem | undefined =>
  internalStore.getState()[id]

export const getInternals = () => ({ stack, store: internalStore })

/**
 * Used in child windows. Makes different instances of Zedux reuse the parent
 * window's internal store and evaluation stack.
 */
export const setInternals = (internals: {
  stack: StackItem[]
  store: typeof internalStore
}) => {
  internalStore = internals.store
  setStack(internals.stack)
}

export const wipe = () => {
  const ecosystems = Object.values(internalStore.getState().ecosystems)

  ecosystems.forEach(es => {
    es.destroy(true)
  })
}
