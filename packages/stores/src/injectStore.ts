import { createStore, zeduxTypes, Store } from '@zedux/core'
import {
  injectEffect,
  injectRef,
  injectSelf,
  InjectStoreConfig,
} from '@zedux/atoms'
import { PartialStoreAtomInstance } from './types'

export const doSubscribe = <State>(
  instance: PartialStoreAtomInstance,
  store: Store<State>
) =>
  store.subscribe((n, o, action) => {
    // Nothing to do if the state hasn't changed. Also, ignore state updates
    // during evaluation.
    if (instance._isEvaluating || action.meta === zeduxTypes.ignore) {
      return
    }

    const isBatch = action?.meta === zeduxTypes.batch

    instance.w.push({ n, o }) === 1 &&
      (isBatch
        ? instance.e._scheduler.schedule(instance)
        : instance.e.a(instance))

    // run the scheduler synchronously after every store update unless batching
    if (!isBatch) {
      instance.e._scheduler.flush()
    }
  })

/**
 * injectStore()
 *
 * A convenience utility for quickly creating and optionally subscribing to
 * stores in atoms.
 *
 * The returned store is a stable reference - it will not change on subsequent
 * evaluations. It can therefore be returned from the instance factory as the
 * instance's store. It also doesn't _need_ to be added to injector deps arrays
 * (though there's no harm in doing so).
 *
 * Accepts either the initial store state or a function that returns the store.
 * Use the latter for maximum flexibility.
 *
 * Subscribes to the store by default, causing the atom to be reevaluated on
 * every state change. This can be changed by passing `subscribe: false`.
 *
 * In most cases you won't need to prevent subscribing. But it can be a useful
 * performance optimization.
 *
 * ```ts
 * import { atom, injectStore } from '@zedux/atoms'
 *
 * const inputAtom = atom('input', () => {
 *   const store = injectStore('', { subscribe: false })
 *
 *   return store
 * })
 * ```
 *
 * When `hydrate: true` is passed, the store's initial state will be set to the
 * value from the last call to `ecosystem.hydrate()` whose key matches this atom
 * instance. The hydrated value will be passed to the atom's `hydrate` config
 * option, if any, to transform the value first.
 *
 * When the function `storeFactory` overload is used and `hydrate: true` is
 * passed, the transformed hydration will be passed to the store factory
 * function and it's up to you to use it to hydrate the store you create.
 *
 * ```ts
 * const store = injectStore(
 *   hydration => createStore(null, hydration ?? defaultVal),
 *   { hydrate: true }
 * )
 * // or simply:
 * const store = injectStore(defaultVal, { hydrate: true })
 * ```
 *
 * @param storeFactory - Either a function that returns a store or the initial
 * state of the store
 * @param config - A config object. Accepts the following properties:
 *   - `hydrate` - Whether to try hydrating this store with
 *   - `subscribe` - Whether to subscribe to the store (default: `true`)
 * @returns Store
 */
export const injectStore: {
  <State = any>(
    storeFactory: State | ((hydration?: State) => Store<State>),
    config?: InjectStoreConfig
  ): Store<State>
  <State = undefined>(): Store<State>
} = <State>(
  storeFactory?: State | ((hydration?: State) => Store<State>),
  config?: InjectStoreConfig
) => {
  const instance = injectSelf() as PartialStoreAtomInstance
  const subscribe = config?.subscribe ?? true

  const ref = injectRef<Store<State>>()

  if (!ref.current) {
    const getStore =
      typeof storeFactory === 'function'
        ? (storeFactory as () => Store<State>)
        : (hydration?: State) =>
            createStore<State>(null, hydration ?? storeFactory)

    ref.current = getStore(
      config?.hydrate ? instance.e.hydration?.[instance.id] : undefined
    )
  }

  injectEffect(
    () =>
      subscribe ? doSubscribe(instance, ref.current!).unsubscribe : undefined,
    [subscribe],
    { synchronous: true }
  )

  return ref.current!
}
