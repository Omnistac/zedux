import { readInstance } from '../classes/EvaluationStack'

/**
 * Returns a function that can be called to invalidate the current atom
 * instance.
 *
 * @deprecated This injector will be removed in the next major release. Use the
 * following pattern instead:
 *
 * ```ts
 * const self = injectSelf()
 * // then in a callback or effect:
 * self.invalidate()
 * ```
 */
export const injectInvalidate = () => {
  const instance = readInstance()

  return () => instance.invalidate('injectInvalidate', 'Injector')
}
