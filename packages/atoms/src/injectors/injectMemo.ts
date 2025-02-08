import { InjectorDeps } from '../types/index'
import { untrack } from '../utils/evaluationContext'
import { compare } from '../utils/general'
import { injectPrevDescriptor, setNextInjector } from './injectPrevDescriptor'

interface MemoValue<T> {
  /**
   * `d`eps - the cached `injectMemo` deps array
   */
  d: InjectorDeps

  /**
   * `v`alue - the cached `injectMemo` result
   */
  v: T
}

const TYPE = 'injectMemo'

/**
 * The injector equivalent of React's `useMemo` hook. Memoizes a value. Only
 * calls the valueFactory to produce a new value when deps change on subsequent
 * evaluations.
 */
export const injectMemo = <T = any>(
  valueFactory: () => T,
  deps?: InjectorDeps
): T => {
  const prevDescriptor = injectPrevDescriptor<MemoValue<T>>(TYPE)

  return setNextInjector({
    c: undefined,
    i: undefined,
    t: TYPE,
    v: {
      d: deps,
      v: compare(prevDescriptor?.v.d, deps)
        ? prevDescriptor!.v.v
        : untrack(valueFactory),
    },
  }).v.v
}
