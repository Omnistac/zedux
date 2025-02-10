import { SelectorInstance } from '../classes/SelectorInstance'
import { InjectorDeps } from '../types/index'
import { untrack } from '../utils/evaluationContext'
import { compare } from '../utils/general'
import { injectPrevDescriptor, setNextInjector } from './injectPrevDescriptor'
import { injectSelf } from './injectSelf'

interface MemoValue<T> {
  /**
   * `d`eps - the cached `injectMemo` deps array
   */
  d: InjectorDeps

  /**
   * `n`ode - the cached selector instance for an injectMemo call with no deps
   */
  n: SelectorInstance | undefined

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
  const instance = injectSelf()
  const prevDescriptor = injectPrevDescriptor<MemoValue<T>>(TYPE)
  const depsUnchanged = compare(prevDescriptor?.v.d, deps)

  if (depsUnchanged) return setNextInjector(prevDescriptor!).v.v

  // define this object first so the callback has access to it
  const value: MemoValue<T> = {
    d: deps,
    n: prevDescriptor?.v.n,
    v: undefined as T,
  }

  value.v = deps
    ? untrack(valueFactory)
    : (value.n ??= new SelectorInstance(
        instance.e,
        instance.e._idGenerator.generateId(`injectMemo(${instance.id})-`),
        valueFactory,
        []
      )).get()

  return setNextInjector({
    c: undefined,
    i: undefined,
    t: TYPE,
    v: value,
  }).v.v
}
