import { api } from '../factories/api'
import {
  getErrorPromiseState,
  getInitialPromiseState,
  getSuccessPromiseState,
} from '../utils/promiseUtils'
import {
  AtomApiGenerics,
  AtomInstanceTtl,
  ExportsConfig,
  InjectorDeps,
  InjectPromiseConfig,
  InjectSignalConfig,
  InternalEvaluationReason,
  None,
  Prettify,
  PromiseState,
} from '../types/index'
import { injectEffect } from './injectEffect'
import { injectMemo } from './injectMemo'
import { injectSignal } from './injectSignal'
import { injectRef } from './injectRef'
import { AtomApi } from '../classes/AtomApi'
import type { MappedSignal } from '../classes/MappedSignal'
import type { Signal } from '../classes/Signal'
import { Invalidate } from '../utils/general'
import { injectSelf } from './injectSelf'
import { injectMappedSignal } from './injectMappedSignal'

export interface InjectPromiseAtomApi<
  G extends AtomApiGenerics,
  EventMap extends Record<string, any>,
  Data
> extends AtomApi<G> {
  dataSignal: Signal<{
    Events: EventMap
    ResolvedState: Data
    State: Data | undefined
  }>

  addExports<NewExports extends Record<string, any>>(
    exports: NewExports,
    config?: ExportsConfig
  ): InjectPromiseAtomApi<
    Prettify<
      Omit<G, 'Exports'> & {
        Exports: (G['Exports'] extends Record<string, never>
          ? unknown
          : G['Exports']) &
          NewExports
      }
    >,
    EventMap,
    Data
  >

  setExports<NewExports extends Record<string, any>>(
    exports: NewExports,
    config?: ExportsConfig
  ): InjectPromiseAtomApi<
    Prettify<Omit<G, 'Exports'> & { Exports: NewExports }>,
    EventMap,
    Data
  >

  setPromise<P extends Promise<any> | undefined>(
    promise?: P
  ): InjectPromiseAtomApi<
    Prettify<Omit<G, 'Promise'> & { Promise: P }>,
    EventMap,
    Data
  >

  setTtl(
    ttl: AtomInstanceTtl | (() => AtomInstanceTtl)
  ): InjectPromiseAtomApi<G, EventMap, Data>
}

const hasInvalidateReason = (node: ReturnType<typeof injectSelf>) => {
  if (!node.w) return

  const isSingleReason = node.w === node.wt
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
 * Returns an Atom API with `.signal` and `.promise` set. The returned Atom API
 * will also have a `.dataSignal` property whose state is set to the promise's
 * resolved value. The `.signal` property is a mapped signal that holds promise
 * state and wraps the inner `dataSignal` on its `data` property.
 *
 * @see PromiseState
 *
 * The 2nd `deps` param is just like `injectMemo` - these deps determine when
 * the promise's reference should change.
 *
 * The 3rd `config` param can take the following options:
 *
 * - `events`: A set of custom events that the inner `dataSignal` accepts. An
 *   object mapping event names to payload types. Use the `As` helper to type
 *   payloads.
 *
 * - `initialData`: Set the initial value of the `dataSignal` (also thereby sets
 *   the value of the outer `signal`'s `data` property). E.g. use this to set a
 *   default `data` value before the promise resolves.
 *
 * - `reactive`: Prevent the signal from reevaluating the current atom when its
 *   state changes. Use with caution.
 *
 * - `runOnInvalidate`: Rerun the promise factory, making the `signal`'s cycle
 *   through its promise state again when the current atom is invalidated.
 *
 * ```ts
 * const promiseApi = injectPromise(async () => {
 *   const response = await fetch(url)
 *   return await response.json()
 * }, [url], {
 *   initialData: [],
 *   runOnInvalidate: true,
 * })
 * ```
 */
export const injectPromise: {
  <Data, EventMap extends Record<string, any> = None>(
    promiseFactory: (params: {
      controller?: AbortController
      prevData?: NoInfer<Data>
    }) => Promise<Data>,
    deps: InjectorDeps,
    config: Omit<InjectPromiseConfig<Data>, 'initialData'> & {
      initialData: Data
    } & InjectSignalConfig<EventMap>
  ): InjectPromiseAtomApi<
    {
      Exports: None
      Promise: Promise<Data>
      Signal: MappedSignal<{
        Events: EventMap
        State: Omit<PromiseState<Data>, 'data'> & { data: Data }
      }>
      State: Omit<PromiseState<Data>, 'data'> & { data: Data }
    },
    EventMap,
    Data
  >

  <Data, EventMap extends Record<string, any> = None>(
    promiseFactory: (params: {
      controller?: AbortController
      prevData?: NoInfer<Data>
    }) => Promise<Data>,
    deps: InjectorDeps,
    config?: InjectPromiseConfig<Data> & InjectSignalConfig<EventMap>
  ): InjectPromiseAtomApi<
    {
      Exports: None
      Promise: Promise<Data>
      Signal: MappedSignal<{
        Events: EventMap
        ResolvedState: Omit<PromiseState<Data>, 'data'> & { data: Data }
        State: PromiseState<Data>
      }>
      State: PromiseState<Data>
    },
    EventMap,
    Data
  >
} = <Data, EventMap extends Record<string, any> = None>(
  promiseFactory: (params: {
    controller?: AbortController
    prevData?: NoInfer<Data>
  }) => Promise<Data>,
  deps?: InjectorDeps,
  {
    initialData,
    runOnInvalidate,
    ...signalConfig
  }: InjectPromiseConfig<Data> & InjectSignalConfig<EventMap> = {}
) => {
  const refs = injectRef({ counter: 0 } as {
    controller?: AbortController
    counter: number
    promise: Promise<Data>
  })

  const dataSignal = injectSignal(initialData, signalConfig) as Signal<{
    Events: EventMap
    ResolvedState: Data
    State: Data | undefined
  }>

  const signal = injectMappedSignal({
    ...getInitialPromiseState<Data>(),
    data: dataSignal,
  }) as MappedSignal<{
    Events: EventMap
    State: PromiseState<Data>
  }>

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
    let promise: ReturnType<typeof promiseFactory> | undefined

    try {
      promise = promiseFactory({
        controller: refs.current.controller,
        prevData: dataSignal.v,
      })
    } catch (err) {
      signal.mutate(getErrorPromiseState(err))

      return Promise.reject(err) as Promise<Data>
    }

    if (DEV && typeof promise?.then !== 'function') {
      throw new TypeError(
        'Zedux: injectPromise expected callback to return a promise',
        { cause: promise }
      )
    }

    if (promise === refs.current.promise) return refs.current.promise

    if (prevController) (prevController as any).abort('updated')

    // preserve previous data and error using mutate:
    signal.mutate(getInitialPromiseState())

    promise
      .then(data => {
        if (nextController?.signal.aborted) return

        signal.set(getSuccessPromiseState(data))
      })
      .catch(error => {
        if (nextController?.signal.aborted) return

        // preserve previous data using mutate:
        signal.mutate(getErrorPromiseState(error))
      })

    return promise as Promise<Data>
  }, deps && [...deps, refs.current.counter])

  injectEffect(
    () => () => {
      const controller = refs.current.controller
      if (controller) (controller as any).abort('destroyed')
    },
    []
  )

  const atomApi = api(signal).setPromise(
    refs.current.promise
  ) as unknown as InjectPromiseAtomApi<
    {
      Exports: None
      Promise: Promise<Data>
      Signal: MappedSignal<{
        Events: EventMap
        State: PromiseState<Data>
      }>
      State: PromiseState<Data>
    },
    EventMap,
    Data
  >

  atomApi.dataSignal = dataSignal

  return atomApi as any // required to satisfy both overloads
}
