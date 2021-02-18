import { Composable } from '../../core/src/types'
import { assertAreFunctions } from '../../core/src/utils/errors'

/**
  Composes multiple functions together from right-to-left.
  For example

    compose(f, g, h)(x)

  is equivalent to

    f(g(h(x)))

  Returns the identity function if nothing is passed.

  Returns the given function if one argument is passed.
*/
export function compose<T>(): (arg: T) => T
export function compose<F>(func: F): F
export function compose<C = (...args: any[]) => any>(
  ...funcs: ((...args: any[]) => any)[]
): C
export function compose<T = any>(...funcs: Array<Composable<T>>) {
  // If nothing is passed, return the identity function
  if (funcs.length === 0) return (arg: T) => arg

  assertAreFunctions(funcs, 'compose()')

  // If one function is passed, just return it
  if (funcs.length === 1) return funcs[0]

  return funcs.reduce((composedFunction, nextFunction) => (...args) =>
    composedFunction(nextFunction(...args))
  )
}
