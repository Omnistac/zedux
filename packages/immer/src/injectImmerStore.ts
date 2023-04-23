import {
  injectEffect,
  injectMemo,
  injectSelf,
  InjectStoreConfig,
  zeduxTypes,
  PartialAtomInstance,
  Store,
} from '@zedux/atoms'
import { createImmerStore } from './createImmerStore'

const operation = 'injectImmerStore'

const doSubscribe = <State>(
  instance: PartialAtomInstance,
  store: Store<State>
) =>
  store.subscribe((newState, oldState, action) => {
    // Nothing to do if the state hasn't changed. Also ignore state updates
    // during evaluation or that are caused by `zeduxTypes.ignore` actions
    if (
      newState === oldState ||
      instance.ecosystem._evaluationStack.isEvaluating(instance.id) ||
      action?.meta === zeduxTypes.ignore
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
    if (action?.meta !== zeduxTypes.batch) {
      instance.ecosystem._scheduler.flush()
    }
  })

export const injectImmerStore: {
  <State = any>(state: State, config?: InjectStoreConfig): Store<State>
  <State = undefined>(): Store<State>
} = <State = any>(state?: State, config?: InjectStoreConfig) => {
  const instance = injectSelf()
  const subscribe = config?.subscribe ?? true

  const store = injectMemo(() => {
    const hydration = config?.hydrate
      ? instance.ecosystem._consumeHydration(instance)
      : undefined

    return createImmerStore<State>(hydration ?? state)
  }, [])

  injectEffect(
    () => {
      if (!subscribe) return

      const subscription = doSubscribe(instance, store)

      return () => subscription?.unsubscribe()
    },
    [subscribe],
    { synchronous: true }
  )

  return store
}
