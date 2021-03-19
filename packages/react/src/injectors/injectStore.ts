import { createStore, Store } from '@zedux/core'
import { EvaluationType, EvaluationTargetType } from '../utils'
import { diContext } from '../utils/csContexts'
import { injectEffect } from './injectEffect'
import { injectMemo } from './injectMemo'

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
 * @param shouldSubscribe - Whether to subscribe to the store (default `true`)
 * @returns Store
 */
export const injectStore = <State = any>(
  storeFactory?: (() => Store<State>) | State,
  shouldSubscribe = true
) => {
  const { scheduleEvaluation } = diContext.consume()

  const store = injectMemo(() => {
    const getStore =
      typeof storeFactory === 'function'
        ? (storeFactory as () => Store<State>)
        : () => createStore<State>(null, storeFactory)

    return getStore()
  }, [])

  injectEffect(() => {
    if (!shouldSubscribe) return

    const subscription = store.subscribe({
      effects: ({ action, newState, oldState }) => {
        if (newState === oldState) return

        scheduleEvaluation({
          newState,
          oldState,
          operation: 'injectStore()',
          reasons: [
            {
              action,
              newState,
              oldState,
              operation: 'dispatch()',
              targetType: EvaluationTargetType.Store,
              type: EvaluationType.StateChanged,
            },
          ],
          targetType: EvaluationTargetType.Injector,
          type: EvaluationType.StateChanged,
        })
      },
    })

    return () => subscription.unsubscribe()
  }, [scheduleEvaluation, shouldSubscribe, store])

  return store
}
