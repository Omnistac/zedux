import { detailedTypeof, Store } from '@zedux/core'
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
import { AtomApi } from '../classes'

/**
 * Create a memoized promise reference. Kicks off the promise immediately
 * (unlike injectEffect which waits a tick). Creates a store to track promise
 * state. This store's state shape is based off React Query:
 *
 * ```ts
 * {
 *   data?: <promise result type>
 *   error?: Error
 *   isError: boolean
 *   isLoading: boolean
 *   isSuccess: boolean
 *   status: 'error' | 'loading' | 'success'
 * }
 * ```
 *
 * Returns an Atom API with `.store` and `.promise` set.
 *
 * The 2nd `deps` param is just like `injectMemo` - these deps determine when
 * the promise's reference should change.
 *
 * The 3rd `config` param can take the following options:
 *
 * - `dataOnly`: Set this to true to prevent the store from tracking promise
 *   status and make your promise's `data` the entire state.
 *
 * - `initialState`: Set the initial state of the store (e.g. a placeholder
 *   value before the promise resolves)
 *
 * - store config: Any other config options will be passed directly to
 *   `injectStore`'s config. For example, pass `subscribe: false` to
 *   prevent the store from reevaluating the current atom on update.
 *
 * ```ts
 * const promiseApi = injectPromise(async () => {
 *   const response = await fetch(url)
 *   return await response.json()
 * }, [url], {
 *   dataOnly: true,
 *   initialState: '',
 *   subscribe: false
 * })
 * ```
 */
export const injectPromise: {
  <T>(
    promiseFactory: (controller?: AbortController) => Promise<T>,
    deps: InjectorDeps,
    config: { initialState?: T; dataOnly: true } & InjectStoreConfig
  ): AtomApi<T, Record<string, any>, Store<T>, Promise<T>>

  <T>(
    promiseFactory: (controller?: AbortController) => Promise<T>,
    deps?: InjectorDeps,
    config?: { initialState?: T; dataOnly?: boolean } & InjectStoreConfig
  ): AtomApi<
    PromiseState<T>,
    Record<string, any>,
    Store<PromiseState<T>>,
    Promise<T>
  >
} = <T>(
  promiseFactory: (controller?: AbortController) => Promise<T>,
  deps?: InjectorDeps,
  {
    dataOnly,
    initialState,
    ...storeConfig
  }: { dataOnly?: boolean; initialState?: T } & InjectStoreConfig = {}
) => {
  const refs = injectRef(
    {} as { controller?: AbortController; promise: Promise<T> }
  )

  const store = injectStore(
    dataOnly ? initialState : getInitialPromiseState<T>(initialState),
    storeConfig
  )

  // setting a ref during evaluation is perfectly fine in Zedux
  refs.current.promise = injectMemo(() => {
    const prevController = refs.current.controller
    const nextController =
      typeof AbortController !== 'undefined' ? new AbortController() : undefined

    refs.current.controller = nextController
    const promise = promiseFactory(refs.current.controller)

    if (DEV && typeof promise?.then !== 'function') {
      throw new TypeError(
        `Zedux: injectPromise expected callback to return a promise. Received ${detailedTypeof(
          promise
        )}`
      )
    }

    if (promise === refs.current.promise) return refs.current.promise

    if (prevController) (prevController as any).abort('updated')

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
    () => () => {
      const controller = refs.current.controller
      if (controller) (controller as any).abort('destroyed')
    },
    []
  )

  return api(store).setPromise(refs.current.promise)
}
