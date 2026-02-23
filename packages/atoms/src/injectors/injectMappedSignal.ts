import { MappedSignal, SignalMap } from '../classes/MappedSignal'
import { Signal } from '../classes/Signal'
import {
  AnyNonNullishValue,
  EventsOf,
  InjectSignalConfig,
  None,
  Prettify,
  StateOf,
} from '../types/index'
import { Eventless, EventlessStatic } from '../utils/general'
import { injectMemo } from './injectMemo'
import { injectSelf } from './injectSelf'

type MapAll<M extends SignalMap> = MapEventsToPayloads<{
  [K in keyof M]: M[K] extends Signal<any> ? EventsOf<M[K]> : None
}>

type MapEventsToPayloads<Events extends Record<string, any>> = TupleToEvents<
  Events,
  UnionToTuple<keyof Events>
>

type TupleToEvents<
  Events extends Record<string, any>,
  T extends any[]
> = T extends [infer K, ...infer Rest]
  ? K extends keyof Events
    ? Events[K] & TupleToEvents<Omit<Events, K>, Rest>
    : never
  : AnyNonNullishValue

type UnionToIntersection<U> = (
  U extends never ? never : (arg: U) => never
) extends (arg: infer I) => void
  ? I
  : never

type UnionToTuple<T> = UnionToIntersection<
  T extends never ? never : (t: T) => T
> extends (_: never) => infer W
  ? [...UnionToTuple<Exclude<T, W>>, W]
  : []

/**
 * Creates a special "mapped" signal that wraps other signals. The state of
 * mapped signals is always a normal JS object.
 *
 * Automatically keeps the inner signal references up-to-date on every
 * evaluation and re-creates any that are force-destroyed.
 *
 * Also accepts non-signal values. These are set as-is in the mapped signal's
 * state on initial evaluation and ignored on subsequent evaluations.
 *
 * Does not support deeply-nested objects. Use multiple `injectMappedSignal`
 * calls for that.
 *
 * ```ts
 * const otherSignal = injectSignal('other state')
 * const nestedSignal = injectAtomInstance(otherAtom) // atoms are signals
 *
 * const signal = injectMappedSignal({
 *   other: otherSignal, // ref kept in sync
 *   nonSignal: 'any value here', // sets only the initial state of this field
 *   nestedMappedSignal: injectMappedSignal({
 *     nested: nestedSignal // ref kept in sync
 *   })
 * })
 * ```
 *
 * Can also wrap a single signal, creating a thin wrapper that keeps the inner
 * signal reference up-to-date:
 *
 * ```ts
 * const inner = injectSignal({ count: 0 })
 * const signal = injectMappedSignal(inner)
 * ```
 *
 * For TS users, custom events can be configured the same way as
 * {@link injectSignal}
 */
export function injectMappedSignal<
  S extends Signal<any>,
  EventMap extends Record<string, any> = None
>(
  signal: S,
  config?: InjectSignalConfig<EventMap>
): MappedSignal<{
  Events: Prettify<EventsOf<S> & EventMap>
  State: StateOf<S>
}>

export function injectMappedSignal<
  M extends SignalMap,
  EventMap extends Record<string, any> = None
>(
  map: M,
  config?: InjectSignalConfig<EventMap>
): MappedSignal<{
  Events: Prettify<MapAll<M> & EventMap>
  State: { [K in keyof M]: M[K] extends Signal<any> ? StateOf<M[K]> : M[K] }
}>

export function injectMappedSignal(
  mapOrSignal: SignalMap | Signal<any>,
  config?: InjectSignalConfig<any>
) {
  const instance = injectSelf()

  const signal = injectMemo(
    () =>
      new MappedSignal(
        instance.e,
        instance.e.makeId('signal', instance),
        mapOrSignal
      ),
    []
  )

  // create a graph edge between the current atom and the new signal
  signal.get({
    f: config?.reactive === false ? EventlessStatic : Eventless,
    op: 'injectMappedSignal',
  })

  // iterate over the passed object on every evaluation. Check for any changed
  // inner signal references and swap them out if needed.
  signal.u(mapOrSignal)

  return signal
}
