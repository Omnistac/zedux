import {
  assertAreFunctions
} from '../utils/errors'

import { createSelector } from '../utils/memoize'


/**
  Creates a memoized selector for computing derived state.
*/
export function select(...args) {
  assertAreFunctions(args, 'select()')

  const calculator = args.slice(-1)[0]
  const dependencies = args.slice(0, -1)

  return createSelector(calculator, dependencies)
}
