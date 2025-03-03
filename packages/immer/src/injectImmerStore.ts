import {
  injectEffect,
  injectMemo,
  injectSelf,
  InjectStoreConfig,
} from '@zedux/atoms'
import { zeduxTypes, Store } from '@zedux/core'
import { PartialStoreAtomInstance } from '@zedux/stores'
import { createImmerStore } from './createImmerStore'

const doSubscribe = <State>(
  instance: PartialStoreAtomInstance,
  store: Store<State>
) =>
  store.subscribe((newState, oldState, action) => {
    // Nothing to do if the state hasn't changed. Also ignore state updates
    // during evaluation or that are caused by `zeduxTypes.ignore` actions
    if (
      newState === oldState ||
      instance._isEvaluating ||
      action?.meta === zeduxTypes.ignore
    ) {
      return
    }

    instance.r({ o: oldState })

    // run the scheduler synchronously after any store update
    if (action?.meta !== zeduxTypes.batch) {
      instance.e.syncScheduler.flush()
    }
  })

export const injectImmerStore: {
  <State = any>(state: State, config?: InjectStoreConfig): Store<State>
  <State = undefined>(): Store<State>
} = <State = any>(state?: State, config?: InjectStoreConfig) => {
  const instance = injectSelf() as PartialStoreAtomInstance
  const subscribe = config?.subscribe ?? true

  const store = injectMemo(() => {
    const hydration = config?.hydrate
      ? instance.e.hydration?.[instance.id]
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
