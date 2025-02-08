import { InjectorDescriptor } from '../classes/instances/AtomInstance'
import { AnyAtomInstance } from '../types'
import { getEvaluationContext } from '../utils/evaluationContext'
import { injectSelf } from './injectSelf'

/**
 * A low-level injector only used internally.
 *
 * Tracks injector usages in the currently-evaluating atom and ensures injectors
 * are called in the same order every evaluation, just like React hooks.
 *
 * `injectSelf` is the source of all injectors - restricted or unrestricted.
 * This is the source of all restricted injectors. All Zedux's restricted
 * injectors use this internally.
 *
 * Always pair this with a call to `setNextInjector`.
 */
export const injectPrevDescriptor = <T>(
  type: string
): InjectorDescriptor<T> | undefined => {
  const instance = injectSelf()

  // a restricted injector was used. Initialize `N`extInjectors if it isn't yet
  instance.N ??= []

  const { I, id, l, N } = instance

  if (l === 'Initializing') return

  const prevDescriptor = I?.[N.length]

  if (!prevDescriptor || prevDescriptor.t !== type) {
    throw new Error(
      `Zedux: ${type} in atom "${id}" - injectors cannot be added, removed, or reordered`
    )
  }

  return prevDescriptor
}

/**
 * Only used internally after a previous call to `injectPrevDescriptor`. Tracks
 * an injector call in the currently-evaluating atom instance's `N`extInjectors.
 */
export const setNextInjector = <T>(descriptor: InjectorDescriptor<T>) => {
  ;(getEvaluationContext().n! as AnyAtomInstance).N!.push(descriptor)

  return descriptor
}
