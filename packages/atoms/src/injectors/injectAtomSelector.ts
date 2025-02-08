import { ParamsOf, Selectable, StateOf } from '../types/index'
import { injectSelf } from './injectSelf'

/**
 * @deprecated use `injectAtomValue` instead
 *
 * ```ts
 * injectAtomSelector(mySelector, arg1, arg2) // before
 * injectAtomValue(mySelector, [arg1, arg2]) // after
 * ```
 */
export const injectAtomSelector = <S extends Selectable>(
  selectable: S,
  ...args: ParamsOf<S>
): StateOf<S> => injectSelf().e.get(selectable, args)
