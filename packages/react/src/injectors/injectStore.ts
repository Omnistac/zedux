import { createStore, Store } from '@zedux/core'
import { AtomInstanceBase } from '../classes'
import {
  EvaluationType,
  EvaluationTargetType,
  split,
  StoreInjectorDescriptor,
  InjectorType,
} from '../utils'

const doSubscribe = <State>(
  instance: AtomInstanceBase<any, [...any], any>,
  store: Store<State>
) =>
  store.subscribe({
    effects: ({ action, newState, oldState }) => {
      // Nothing to do if the state hasn't changed. Also, ignore state updates
      // during evaluation. TODO: Create an ecosystem-level flag to turn on
      // warning logging for state-updates-during-evaluation, since this may be
      // considered an anti-pattern.
      if (newState === oldState || instance._isEvaluating) return

      instance._scheduleEvaluation({
        newState,
        oldState,
        operation: 'injectStore',
        reasons: [
          {
            action,
            newState,
            oldState,
            operation: 'dispatch',
            targetType: EvaluationTargetType.Store,
            type: EvaluationType.StateChanged,
          },
        ],
        targetType: EvaluationTargetType.Injector,
        type: EvaluationType.StateChanged,
      })

      // run the scheduler synchronously after any store update
      instance.ecosystem._scheduler.flush()
    },
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
 * every state change. This can be changed by passing `false` as the second
 * argument.
 *
 * ```ts
 * import { atom, injectStore } from '@zedux/react'
 *
 * const inputAtom = atom('input', () => {
 *   // initial state: '', shouldSubscribe: false
 *   const store = injectStore('', false)
 *
 *   return store
 * })
 * ```
 *
 * @param storeFactory - Either a function that returns a store or the initial
 * state of the store
 * @param shouldSubscribe - Whether to subscribe to the store (default `false`)
 * @returns Store
 */
export const injectStore = <State = any>(
  storeFactory?: State | (() => Store<State>),
  shouldSubscribe = false
) => {
  const { store } = split<StoreInjectorDescriptor<State>>(
    'injectStore',
    InjectorType.Store,
    ({ instance }) => {
      const getStore =
        typeof storeFactory === 'function'
          ? (storeFactory as () => Store<State>)
          : () => createStore<State>(null, storeFactory)

      const store = getStore()

      const subscription = shouldSubscribe && doSubscribe(instance, store)

      return {
        cleanup: subscription ? () => subscription.unsubscribe() : undefined,
        store,
        type: InjectorType.Store,
      }
    },
    (prevInjector, { instance }) => {
      const prevShouldSubscribe = !!prevInjector.cleanup

      if (prevShouldSubscribe === shouldSubscribe) return prevInjector

      // we were subscribed, now we're not
      if (!shouldSubscribe) {
        prevInjector.cleanup?.()
        prevInjector.cleanup = undefined
        return prevInjector
      }

      // we weren't subscribed, now we are
      const subscription = doSubscribe(instance, prevInjector.store)
      prevInjector.cleanup = () => subscription.unsubscribe()

      return prevInjector
    }
  )

  return store
}
