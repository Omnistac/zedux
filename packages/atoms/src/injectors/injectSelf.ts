import { readInstance } from '../classes/EvaluationStack'
import { AnyAtomInstance, PartialAtomInstance } from '../types/index'

/**
 * An unrestricted injector (can actually be used in loops and if statements).
 *
 * Returns the currently-evaluating AtomInstance. Note that this instance will
 * not have its `exports`, `promise`, or `store` set yet on initial evaluation.
 */
export const injectSelf = readInstance as () =>
  | AnyAtomInstance
  | PartialAtomInstance
