import { AnyAtomInstance, PartialAtomInstance } from '../types/index'
import { readInstance } from '../utils/evaluationContext'

/**
 * An unrestricted injector (can actually be used in loops and if statements).
 *
 * Returns the currently-evaluating AtomInstance. Note that this instance will
 * not have its `exports`, `promise`, or `signal` set yet on initial evaluation.
 */
export const injectSelf = readInstance as () =>
  | AnyAtomInstance
  | PartialAtomInstance
