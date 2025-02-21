import { AnyAtomInstance, PartialAtomInstance } from '../types/index'
import { getEvaluationContext } from '../utils/evaluationContext'
import { AtomInstance } from '../classes/instances/AtomInstance'
import { is } from '../utils/general'

/**
 * An unrestricted injector (can actually be used in loops and if statements).
 *
 * Returns the currently-evaluating AtomInstance. Note that this instance will
 * not have its `exports`, `promise`, or `signal` set yet on initial evaluation.
 *
 * This is the entry point for all Zedux injectors. If a function calls this,
 * it's an injector.
 *
 * Throws an error if called outside an atom state factory.
 */
export const injectSelf = (): AnyAtomInstance | PartialAtomInstance => {
  const node = getEvaluationContext().n

  if (DEV && !is(node, AtomInstance)) {
    throw new Error('Zedux: Injectors can only be used in atom state factories')
  }

  return node as AnyAtomInstance
}
