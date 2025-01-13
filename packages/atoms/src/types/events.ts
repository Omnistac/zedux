import { RecursivePartial } from '@zedux/core'
import {
  AnyNodeGenerics,
  AtomGenerics,
  ChangeEvent,
  Cleanup,
  GraphEdgeConfig,
  NodeGenerics,
  Prettify,
} from './index'

/**
 * Events that can be dispatched manually. This is not the full list of events
 * that can be listened to on Zedux event emitters - for example, all stateful
 * nodes emit `change` and (via the ecosystem) `cycle` events and atoms emit
 * `promisechange` events.
 */
export interface ExplicitEvents {
  /**
   * Dispatch a `batch` event alongside any `.set` or `.mutate` update to defer notifying dependents
   */
  batch: boolean

  /**
   * `mutate` events can be dispatched manually alongside a `.set` call to
   * bypass Zedux's automatic proxy-based mutation tracking. This may be desired
   * for better performance or when using data types that Zedux doesn't natively
   * proxy.
   *
   * ```ts
   * mySignal.set(state => ({ ...state, a: 1 }), { mutate: [{ k: 'a', v: 1 }] })
   * ```
   */
  mutate: Transaction[]
}

export type CatchAllListener<G extends NodeGenerics> = (
  eventMap: Partial<ListenableEvents<G>>
) => void

export interface EventEmitter<G extends NodeGenerics = AnyNodeGenerics> {
  // TODO: add a `passive` option for listeners that don't prevent destruction
  on<E extends keyof G['Events']>(
    eventName: E,
    callback: SingleEventListener<G, E>,
    edgeDetails?: GraphEdgeConfig
  ): Cleanup

  on(callback: CatchAllListener<G>, edgeDetails?: GraphEdgeConfig): Cleanup
}

export interface ImplicitEvents<G extends NodeGenerics = AnyNodeGenerics> {
  change: ChangeEvent<G>
}

export type ListenableEvents<G extends NodeGenerics> = Prettify<
  G['Events'] & ExplicitEvents & ImplicitEvents<G>
>

export type Mutatable<State> =
  | RecursivePartial<State>
  | ((state: State) => void)

export type MutatableTypes = any[] | Record<string, any> | Set<any>

export type SendableEvents<G extends Pick<AtomGenerics, 'Events'>> = Prettify<
  G['Events'] & ExplicitEvents
>

export type SingleEventListener<
  G extends NodeGenerics,
  E extends keyof G['Events']
> = (
  payload: ListenableEvents<G>[E],
  eventMap: Partial<ListenableEvents<G>>
) => void

/**
 * A transaction is a serializable representation of a mutation operation on one
 * of the supported data types (native JS object, array, and Set).
 */
export interface Transaction {
  /**
   * `k`ey - either a top-level object key or an indefinitely-nested array of
   * keys detailing the "path" through a nested state object to the field that
   * updated.
   */
  k: PropertyKey | PropertyKey[]

  /**
   * If `t`ype isn't specified, an "add"/"update" is assumed ("update" if key
   * exists already, "add" if not).
   *
   * The "d"elete type means different things for each data type:
   *
   * - For objects, the `delete` operator was used
   * - For arrays, a method like `.splice` or `.pop` was used
   * - For sets, `.delete` was used
   *
   * The "i"nsert type is array-specific. It means this `val` should be inserted
   * at `k`ey index, pushing back the item already at that index (and all items
   * thereafter) rather than replacing it.
   */
  t?: 'd' | 'i' // `d`elete | `i`nsert

  /**
   * `v`alue - the new value of the `k`ey
   */
  v?: any
}

export type UndefinedEvents<Events extends Record<string, any>> = {
  [K in keyof Events]: Events[K] extends undefined ? K : never
}[keyof Events]
