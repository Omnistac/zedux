import {
  destroyBuffer,
  flushBuffer,
  startBuffer,
} from './utils/evaluationContext'
import { sendImplicitEcosystemEvent } from './utils/events'
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
export { untrack } from './utils/evaluationContext'

// These are very obfuscated on purpose. Don't use! They're for Zedux packages.
export const zi = {
  a: scheduleStaticDependents,
  b: destroyNodeStart,
  d: destroyBuffer,
  e: destroyNodeFinish,
  i: sendImplicitEcosystemEvent,
  f: flushBuffer,
  s: startBuffer,
  u: scheduleDependents,
}
