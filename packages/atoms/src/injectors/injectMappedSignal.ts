import { MappedSignal, SignalMap } from '../classes/MappedSignal'
import { Signal } from '../classes/Signal'
import {
  AnyNonNullishValue,
  EventMap,
  EventsOf,
  InjectSignalConfig,
  MapEvents,
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
 */
export const injectMappedSignal = <
  M extends SignalMap,
  MappedEvents extends EventMap = None
>(
  map: M,
  config?: InjectSignalConfig<MappedEvents>
) => {
  const instance = injectSelf()

  const signal = injectMemo(() => {
    return new MappedSignal<{
      Events: Prettify<MapAll<M> & MapEvents<MappedEvents>>
      State: { [K in keyof M]: M[K] extends Signal<any> ? StateOf<M[K]> : M[K] }
    }>(instance.e, instance.e.makeId('signal', instance), map)
  }, [])

  // create a graph edge between the current atom and the new signal
  signal.get({
    f: config?.reactive === false ? EventlessStatic : Eventless,
    op: 'injectMappedSignal',
  })

  // iterate over the passed object on every evaluation. Check for any changed
  // inner signal references and swap them out if needed.
  signal.u(map)

  return signal
}
