import {
  createInjector,
  InjectStoreConfig,
  internalTypes,
  PartialAtomInstance,
  Store,
} from '@zedux/react'
import { createImmerStore } from './createImmerStore'
import { ImmerStore } from './ImmerStore'

const operation = 'injectImmerStore'

const doSubscribe = <State>(
  instance: PartialAtomInstance,
  store: Store<State>
) =>
  store.subscribe({
    effects: ({ action, newState, oldState }) => {
      // Nothing to do if the state hasn't changed. Also, ignore state updates
      // during evaluation. TODO: Create an ecosystem-level flag to turn on
      // warning logging for state-updates-during-evaluation, since this may be
      // considered an anti-pattern.
      if (
        newState === oldState ||
        instance.ecosystem._evaluationStack.isEvaluating(instance.keyHash) ||
        action?.meta === internalTypes.ignore
      ) {
        return
      }

      instance._scheduleEvaluation(
        {
          newState,
          oldState,
          operation,
          reasons: [
            {
              action,
              newState,
              oldState,
              operation: 'dispatch',
              sourceType: 'Store',
              type: 'state changed',
            },
          ],
          sourceType: 'Injector',
          type: 'state changed',
        },
        false
      )

      // run the scheduler synchronously after any store update
      instance.ecosystem._scheduler.flush()
    },
  })

export const injectImmerStore: {
  <State = any>(state: State, config?: InjectStoreConfig): Store<State>
  <State = undefined>(): Store<State>
} = createInjector(
  operation,
  <State = any>(
    instance: PartialAtomInstance,
    state?: State,
    config?: InjectStoreConfig
  ) => {
    const subscribe = config?.subscribe ?? true
    const hydration = instance.ecosystem._consumeHydration(instance)
    const store = createImmerStore<State>(hydration ?? state)

    const subscription = subscribe && doSubscribe(instance, store)

    return {
      cleanup: subscription ? () => subscription.unsubscribe() : undefined,
      result: store,
      type: '@@zedux/immerStore',
    }
  },
  <State = any>(
    prevDescriptor: {
      cleanup?: () => void
      result: ImmerStore<State>
      type: string
    },
    instance: PartialAtomInstance,
    state?: State,
    config?: InjectStoreConfig
  ) => {
    const subscribe = config?.subscribe ?? true
    const prevsubscribe = !!prevDescriptor.cleanup

    if (prevsubscribe === subscribe) return prevDescriptor

    // we were subscribed, now we're not
    if (!subscribe) {
      prevDescriptor.cleanup?.()
      prevDescriptor.cleanup = undefined
      return prevDescriptor
    }

    // we weren't subscribed, now we are
    const subscription = doSubscribe(instance, prevDescriptor.result)
    prevDescriptor.cleanup = () => subscription.unsubscribe()

    return prevDescriptor
  }
)
