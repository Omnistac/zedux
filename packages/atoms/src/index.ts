import { createInjector } from './factories/createInjector'
import {
  destroyBuffer,
  flushBuffer,
  getEvaluationContext,
  startBuffer,
} from './utils/evaluationContext'
import {
  destroyNodeFinish,
  destroyNodeStart,
  scheduleDependents,
  scheduleStaticDependents,
} from './utils/graph'

export * from '@zedux/core'
export * from './classes/index'
export * from './factories/index'
export * from './injectors/index'
export { getEcosystem, getInternals, setInternals, wipe } from './store/index'
export * from './types/index'

// These are very obfuscated on purpose. Don't use! They're for Zedux packages.
export const zi = {
  a: scheduleStaticDependents,
  b: destroyNodeStart,
  c: createInjector,
  d: destroyBuffer,
  e: destroyNodeFinish,
  f: flushBuffer,
  g: getEvaluationContext,
  s: startBuffer,
  u: scheduleDependents,
}
