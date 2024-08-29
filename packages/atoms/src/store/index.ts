import { createStore } from '@zedux/core'
import { Ecosystem } from '../classes/Ecosystem'
import {
  EvaluationContext,
  getEvaluationContext,
  setEvaluationContext,
} from '../utils/evaluationContext'

export let internalStore = createStore(null, {} as Record<string, Ecosystem>)

export const getEcosystem = (id: string): Ecosystem | undefined =>
  internalStore.getState()[id]

export const getInternals = () => ({
  c: getEvaluationContext(),
  s: internalStore,
})

/**
 * Used in child windows. Makes different instances of Zedux reuse the parent
 * window's internal store and evaluation stack.
 */
export const setInternals = (internals: {
  c: EvaluationContext
  s: typeof internalStore
}) => {
  internalStore = internals.s
  setEvaluationContext(internals.c)
}

export const wipe = () => {
  const ecosystems = Object.values(internalStore.getState().ecosystems)

  ecosystems.forEach(es => {
    es.destroy(true)
  })
}
