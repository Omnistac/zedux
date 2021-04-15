import { createStore, Settable } from '@zedux/core'
import { split } from '../utils'
import {
  EvaluationType,
  EvaluationTargetType,
  InjectorType,
  StateInjectorDescriptor,
} from '../utils/types'

export const injectState = <State = any>(initialState?: Settable<State>) => {
  const { store } = split<StateInjectorDescriptor<State>>(
    'injectState',
    InjectorType.State,
    ({ scheduleEvaluation }) => {
      const store = createStore<State>()
      if (typeof initialState !== 'undefined') store.setState(initialState)

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

      return {
        cleanup: () => subscription.unsubscribe(),
        store,
        type: InjectorType.State,
      }
    }
  )

  return [store.getState(), store.setState, store] as const
}
