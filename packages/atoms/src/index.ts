import type { Ecosystem } from './classes/Ecosystem'
import {
  getDefaultEcosystem,
  setDefaultEcosystem,
} from './factories/createEcosystem'
import {
  destroyBuffer,
  EvaluationContext,
  flushBuffer,
  getEvaluationContext,
  setEvaluationContext,
} from './utils/evaluationContext'
import { sendImplicitEcosystemEvent } from './utils/events'
import { DESTROYED, INITIALIZING } from './utils/general'
import {
  destroyNodeFinish,
  destroyNodeStart,
  scheduleDependents,
  scheduleStaticDependents,
} from './utils/graph'

export * from './classes/index'
export * from './factories/index'
export * from './injectors/index'
export * from './types/index'
export { untrack } from './utils/evaluationContext'
export { is } from './utils/general'

type Internals = { c: EvaluationContext; g: Ecosystem }

export const getInternals = () => ({
  c: getEvaluationContext(),
  g: getDefaultEcosystem(),
})

/**
 * Used in child windows. Makes different instances of Zedux reuse the parent
 * window's internal store and evaluation stack.
 */
export const setInternals = (internals: Internals) => {
  setEvaluationContext(internals.c)
  setDefaultEcosystem(internals.g)
}

// These are very obfuscated on purpose. Don't use! They're for Zedux packages.
export const zi = {
  a: scheduleStaticDependents,
  b: destroyNodeStart,
  D: DESTROYED,
  d: destroyBuffer,
  e: destroyNodeFinish,
  I: INITIALIZING,
  i: sendImplicitEcosystemEvent,
  f: flushBuffer,
  u: scheduleDependents,
}
