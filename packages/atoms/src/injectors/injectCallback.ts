import { InjectorDeps } from '../types/index'
import { injectMemo } from './injectMemo'
import { injectSelf } from './injectSelf'

/**
 * Memoizes a callback function and wraps it in an `ecosystem.batch()` call and,
 * if the injecting atom is scoped, an `ecosystem.withScope()` call.
 *
 * To memoize a callback without automatic batching/scoping, use `injectMemo`
 * instead:
 *
 * ```ts
 * - injectCallback(myCallback, [])
 * + injectMemo(() => myCallback, [])
 * ```
 */
export const injectCallback = <Args extends any[] = [], Ret = any>(
  callback: (...args: Args) => Ret,
  deps?: InjectorDeps
) => {
  const self = injectSelf()

  return injectMemo(
    () =>
      (...args: Args) =>
        self.e.batch(() =>
          self.V
            ? self.e.withScope(self.V, () => callback(...args))
            : callback(...args)
        ),
    deps
  )
}
