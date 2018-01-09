import { assertAreFunctions } from '../utils/errors'


/**
  Composes multiple functions together from right-to-left.
  For example

    compose(f, g, h)(x)

  is equivalent to

    f(g(h(x)))

  Returns the identity function if nothing is passed.

  Returns the given function if one argument is passed.
*/
export function compose(...funcs) {

  // If nothing is passed, return the identity function
  if (funcs.length === 0) return arg => arg

  assertAreFunctions(funcs, 'compose()')

  // If one function is passed, just return it
  if (funcs.length === 1) return funcs[0]

  return funcs.reduce(
    (composedFunction, nextFunction) =>
      (...args) => composedFunction(nextFunction(...args))
  )
}
