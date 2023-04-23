import { InjectorDeps } from '../types/index'
import { injectAtomGetters } from './injectAtomGetters'
import { injectMemo } from './injectMemo'

/**
 * Memoizes a callback function and wraps it in an `ecosystem.batch()` call.
 *
 * To memoize a callback without automatic batching, use `injectMemo` instead:
 *
 * ```ts
 * injectMemo(() => myCallback, [])
 * ```
 */
export const injectCallback = <Args extends any[] = [], Ret = any>(
  callback: (...args: Args) => Ret,
  deps?: InjectorDeps
) => {
  const { ecosystem } = injectAtomGetters()

  return injectMemo(
    () =>
      (...args: Args) =>
        ecosystem.batch(() => callback(...args)),
    deps
  )
}
