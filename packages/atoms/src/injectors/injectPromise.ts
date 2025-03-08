import { api } from '../factories/api'
import {
  getErrorPromiseState,
  getInitialPromiseState,
  getSuccessPromiseState,
} from '../utils/promiseUtils'
import {
  EventMap,
  InjectorDeps,
  InjectPromiseConfig,
  InjectSignalConfig,
  InternalEvaluationReason,
  MapEvents,
  None,
  PromiseState,
  RecursivePartial,
} from '../types/index'
import { injectEffect } from './injectEffect'
import { injectMemo } from './injectMemo'
import { injectSignal } from './injectSignal'
import { injectRef } from './injectRef'
import { AtomApi } from '../classes/AtomApi'
import { Invalidate } from '../utils/general'
import { Signal } from '../classes/Signal'
import { injectSelf } from './injectSelf'

const hasInvalidateReason = (node: ReturnType<typeof injectSelf>) => {
  if (!node.w) return

  const isSingleReason = node.w === node.wT
  let reason: InternalEvaluationReason | undefined = node.w

  do {
    if ((isSingleReason ? reason : reason.r!).t === Invalidate) return true
  } while ((reason = reason.l))
}

/**
 * Create a memoized promise reference. Kicks off the promise immediately
 * (unlike injectEffect which waits a tick). Creates a signal to track promise
 * state. This signal's state shape is based off React Query:
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
 * Returns an Atom API with `.signal` and `.promise` set.
 *
 * The 2nd `deps` param is just like `injectMemo` - these deps determine when
 * the promise's reference should change.
 *
 * The 3rd `config` param can take the following options:
 *
 * - `dataOnly`: Set this to true to prevent the signal from tracking promise
 *   status and make your promise's `data` the entire state.
 *
 * - `initialState`: Set the initial state of the signal (e.g. a placeholder
 *   value before the promise resolves)
 *
 * - signal config: Any other config options will be passed directly to
 *   `injectSignal`'s config. For example, pass `reactive: false` to
 *   prevent the signal from reevaluating the current atom on update.
 *
 * ```ts
 * const promiseApi = injectPromise(async () => {
 *   const response = await fetch(url)
 *   return await response.json()
 * }, [url], {
 *   dataOnly: true,
 *   initialState: '',
 *   reactive: false
 * })
 * ```
 */
export const injectPromise: {
  <Data, MappedEvents extends EventMap = None>(
    promiseFactory: (controller?: AbortController) => Promise<Data>,
    deps: InjectorDeps,
    config: Omit<InjectPromiseConfig, 'dataOnly'> & {
      dataOnly: true
    } & InjectSignalConfig<MappedEvents>
  ): AtomApi<{
    Exports: Record<string, any>
    Promise: Promise<Data>
    Signal: Signal<{ Events: MapEvents<MappedEvents>; State: Data }>
    State: Data
  }>

  <Data, MappedEvents extends EventMap = None>(
    promiseFactory: (controller?: AbortController) => Promise<Data>,
    deps?: InjectorDeps,
    config?: InjectPromiseConfig<Data> & InjectSignalConfig<MappedEvents>
  ): AtomApi<{
    Exports: Record<string, any>
    Promise: Promise<Data>
    Signal: Signal<{
      Events: MapEvents<MappedEvents>
      State: PromiseState<Data>
    }>
    State: PromiseState<Data>
  }>
} = <Data, MappedEvents extends EventMap = None>(
  promiseFactory: (controller?: AbortController) => Promise<Data>,
  deps?: InjectorDeps,
  {
    dataOnly,
    initialState,
    runOnInvalidate,
    ...signalConfig
  }: InjectPromiseConfig<Data> & InjectSignalConfig<MappedEvents> = {}
) => {
  const refs = injectRef({ counter: 0 } as {
    controller?: AbortController
    counter: number
    promise: Promise<Data>
  })

  const signal = injectSignal(
    dataOnly ? initialState : getInitialPromiseState<Data>(initialState),
    signalConfig
  )

  if (
    runOnInvalidate &&
    // injectWhy is an unrestricted injector - using it conditionally is fine:
    hasInvalidateReason(injectSelf())
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
        'Zedux: injectPromise expected callback to return a promise',
        { cause: promise }
      )
    }

    if (promise === refs.current.promise) return refs.current.promise

    if (prevController) (prevController as any).abort('updated')

    if (!dataOnly) {
      // preserve previous data and error using mutate:
      signal.mutate(
        state =>
          getInitialPromiseState(
            (state as PromiseState<Data>).data
          ) as RecursivePartial<PromiseState<Data>>
      )
    }

    promise
      .then(data => {
        if (nextController?.signal.aborted) return

        signal.set(dataOnly ? data : getSuccessPromiseState(data))
      })
      .catch(error => {
        if (dataOnly || nextController?.signal.aborted) return

        // preserve previous data using mutate:
        signal.mutate(getErrorPromiseState(error))
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

  return api(signal).setPromise(refs.current.promise)
}
