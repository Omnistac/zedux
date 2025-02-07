import { ParamsOf, Selectable, StateOf } from '../types/index'
import { readInstance } from '../utils/evaluationContext'

/**
 * ```ts
 * injectAtomSelector(mySelector, arg1, arg2) // before
 * injectAtomValue(mySelector, [arg1, arg2]) // after
 * ```
 *
 * @deprecated use `injectAtomValue` instead
 */
export const injectAtomSelector = <S extends Selectable>(
  selectable: S,
  ...args: ParamsOf<S>
): StateOf<S> => readInstance().e.get(selectable, args)
