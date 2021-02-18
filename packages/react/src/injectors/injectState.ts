import { createStore, Settable } from '@zedux/core'
import { validateInjector } from '../utils'
import { diContext } from '../utils/diContext'
import {
  EvaluationType,
  EvaluationTargetType,
  InjectorType,
  StateInjectorDescriptor,
} from '../utils/types'

export const injectState = <State = any>(initialState?: Settable<State>) => {
  const context = diContext.consume()
  const { injectors, isInitializing, scheduleEvaluation } = context

  let descriptor = validateInjector<StateInjectorDescriptor<State>>(
    'injectState',
    InjectorType.State,
    context
  )

  if (isInitializing) {
    const store = createStore<State>()
    store.setState(initialState)

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

    descriptor = {
      cleanup: () => subscription.unsubscribe(),
      store,
      type: InjectorType.State,
    }
  }

  injectors.push(descriptor)

  return [
    descriptor.store.getState(),
    descriptor.store.setState,
    descriptor.store,
  ] as const
}
