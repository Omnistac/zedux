import {
  injectEffect,
  injectMemo,
  InjectorDeps,
  InjectPromiseConfig,
  injectRef,
  InjectStoreConfig,
  injectWhy,
  PromiseState,
} from '@zedux/atoms'
import { detailedTypeof, RecursivePartial, Store } from '@zedux/core'
import {
  getErrorPromiseState,
  getInitialPromiseState,
  getSuccessPromiseState,
} from './atoms-port'
import { AtomApi } from './AtomApi'
import { api } from './api'
import { injectStore } from './injectStore'

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
    config: Omit<InjectPromiseConfig, 'dataOnly'> & {
      dataOnly: true
    } & InjectStoreConfig
  ): AtomApi<{
    Exports: Record<string, any>
    Promise: Promise<T>
    State: T
    Store: Store<T>
  }>

  <T>(
    promiseFactory: (controller?: AbortController) => Promise<T>,
    deps?: InjectorDeps,
    config?: InjectPromiseConfig<T> & InjectStoreConfig
  ): AtomApi<{
    Exports: Record<string, any>
    Promise: Promise<T>
    State: PromiseState<T>
    Store: Store<PromiseState<T>>
  }>
} = <T>(
  promiseFactory: (controller?: AbortController) => Promise<T>,
  deps?: InjectorDeps,
  {
    dataOnly,
    initialState,
    runOnInvalidate,
    ...storeConfig
  }: InjectPromiseConfig<T> & InjectStoreConfig = {}
) => {
  const refs = injectRef({ counter: 0 } as {
    controller?: AbortController
    counter: number
    promise: Promise<T>
  })

  const store = injectStore(
    dataOnly ? initialState : getInitialPromiseState<T>(initialState),
    storeConfig
  )

  if (
    runOnInvalidate &&
    // injectWhy is an unrestricted injector - using it conditionally is fine:
    injectWhy().some(reason => reason.type === 'cache invalidated')
  ) {
    refs.current.counter++
  }

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
      store.setStateDeep(
        state =>
          getInitialPromiseState(
            (state as PromiseState<T>).data
          ) as RecursivePartial<PromiseState<T>>
      )
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
  }, deps && [...deps, refs.current.counter])

  injectEffect(
    () => () => {
      const controller = refs.current.controller
      if (controller) (controller as any).abort('destroyed')
    },
    []
  )

  return api(store).setPromise(refs.current.promise)
}
