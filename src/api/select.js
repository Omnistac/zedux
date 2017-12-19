import {
  assertAreFunctions
} from '../utils/errors'

import { slice } from '../utils/general'
import { createSelector } from '../utils/memoize'


/**
  Creates a memoized selector for computing derived state.
*/
export function select() {
  const args = slice.call(arguments)

  assertAreFunctions(args, 'select()')

  const calculator = args.slice(-1)[0]
  const dependencies = args.slice(0, -1)

  return createSelector(calculator, dependencies)
}
