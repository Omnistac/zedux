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

const doSubscribe = <State>(
  instance: PartialAtomInstance,
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

    instance.r({ p: oldState }, false)

    // run the scheduler synchronously after any store update
    if (action?.meta !== zeduxTypes.batch) {
      instance.e._scheduler.flush()
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
