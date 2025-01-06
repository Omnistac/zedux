import { MappedSignal, SignalMap } from '../classes/MappedSignal'
import {
  AnyNonNullishValue,
  EventsOf,
  InjectSignalConfig,
  Prettify,
  StateOf,
} from '../types/index'
import { readInstance } from '../utils/evaluationContext'
import { Static } from '../utils/general'
import { injectAtomGetters } from './injectAtomGetters'
import { injectMemo } from './injectMemo'

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

export const injectMappedSignal = <M extends SignalMap>(
  map: M,
  config?: Pick<
    InjectSignalConfig<MapEventsToPayloads<{ [K in keyof M]: EventsOf<M[K]> }>>,
    'reactive'
  >
) => {
  const instance = readInstance()

  const signal = injectMemo(() => {
    return new MappedSignal<{
      Events: Prettify<MapEventsToPayloads<{ [K in keyof M]: EventsOf<M[K]> }>>
      State: { [K in keyof M]: StateOf<M[K]> }
    }>(
      instance.e,
      instance.e._idGenerator.generateId(`@signal(${instance.id})`),
      map
    )
  }, [])

  // create a graph edge between the current atom and the new signal
  injectAtomGetters().getNode(signal, undefined, {
    f: config?.reactive === false ? Static : 0,
    op: 'injectMappedSignal',
  })

  return signal
}
