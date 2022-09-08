import { Store } from '@zedux/core'
import { detailedTypeof } from '@zedux/core/utils/general'
import { api } from '../factories'
import {
  getErrorPromiseState,
  getInitialPromiseState,
  getSuccessPromiseState,
} from '../utils/promiseUtils'
import { InjectorDeps, InjectStoreConfig, PromiseState } from '../types'
import { injectEffect } from './injectEffect'
import { injectMemo } from './injectMemo'
import { injectStore } from './injectStore'
import { injectRef } from './injectRef'
import { StoreAtomApi } from '../classes'

/**
 * Create a memoized promise reference
 */
export const injectPromise: {
  <T>(
    getPromise: (controller?: AbortController) => Promise<T>,
    deps: InjectorDeps,
    config: { initialState?: T; dataOnly: true } & InjectStoreConfig
  ): StoreAtomApi<Store<T>, Record<string, any>, Promise<T>>

  <T>(
    getPromise: (controller?: AbortController) => Promise<T>,
    deps?: InjectorDeps,
    config?: { initialState?: T; dataOnly?: boolean } & InjectStoreConfig
  ): StoreAtomApi<Store<PromiseState<T>>, Record<string, any>, Promise<T>>
} = <T>(
  getPromise: (controller?: AbortController) => Promise<T>,
  deps?: InjectorDeps,
  {
    initialState,
    dataOnly,
    ...storeConfig
  }: { initialState?: T; dataOnly?: boolean } & InjectStoreConfig = {}
) => {
  const controllerRef = injectRef<AbortController>()
  const promiseRef = injectRef<Promise<T>>()

  const store = injectStore(
    dataOnly ? initialState : getInitialPromiseState<T>(initialState),
    storeConfig
  )

  // setting a ref during evaluation is perfectly fine in Zedux
  promiseRef.current = injectMemo(() => {
    const prevController = controllerRef.current
    const nextController =
      typeof AbortController !== 'undefined' ? new AbortController() : undefined

    controllerRef.current = nextController
    const promise = getPromise(controllerRef.current)

    if (DEV && typeof promise?.then !== 'function') {
      throw new TypeError(
        `Zedux: injectPromise expected callback to return a promise. Received ${detailedTypeof(
          promise
        )}`
      )
    }

    if (promise === promiseRef.current) return promiseRef.current

    prevController?.abort('updated')

    if (!dataOnly) {
      // preserve previous data and error using setStateDeep:
      store.setStateDeep(getInitialPromiseState())
    }

    promise
      .then(data => {
        if (nextController?.signal.aborted) return

        store.setState(dataOnly ? data : getSuccessPromiseState(data))
      })
      .catch(error => {
        if (dataOnly || nextController?.signal.aborted) return

        // preserve previous data using setStateDeep:
        store.setStateDeep(getErrorPromiseState(error))
      })

    return promise
  }, deps)

  injectEffect(
    () => () => (controllerRef.current?.abort as any)?.('destroyed'),
    []
  )

  return api(store).setPromise(promiseRef.current)
}
