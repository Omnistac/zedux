import { createStore, Store } from '@zedux/core'
import { EvaluationType, EvaluationTargetType } from '../utils'
import { diContext } from '../utils/diContext'
import { injectEffect } from './injectEffect'
import { injectMemo } from './injectMemo'

export const injectStore = <State = any>(storeFactory?: () => Store<State>) => {
  const { scheduleEvaluation } = diContext.consume()

  const store = injectMemo(() => {
    const getStore = storeFactory || (() => createStore<State>())
    return getStore()
  }, [])

  injectEffect(() => {
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
  }, [scheduleEvaluation, store])

  return store
}
