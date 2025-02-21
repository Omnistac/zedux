import { GraphNode } from '../classes/GraphNode'
import {
  AnyNodeGenerics,
  AtomGenerics,
  Cleanup,
  LifecycleStatus,
  ListenerConfig,
  NodeGenerics,
  Prettify,
  RecursivePartial,
} from './index'

export type CatchAllListener<G extends NodeGenerics> = (
  eventMap: Partial<ListenableEvents<G>>
) => void

export interface ChangeEvent<G extends NodeGenerics = AnyNodeGenerics>
  extends EventBase {
  newState: G['State']
  oldState: G['State']
  type: 'change'
}

export interface CycleEvent<G extends NodeGenerics = AnyNodeGenerics>
  extends EventBase<G> {
  oldStatus: LifecycleStatus
  newStatus: LifecycleStatus
  type: 'cycle'
}

export type EcosystemEvent = EcosystemEvents[keyof EcosystemEvents]

export interface EcosystemEvents extends ImplicitEvents {
  edge: EdgeEvent
  error: ErrorEvent
  resetEnd: ResetEndEvent
  resetStart: ResetStartEvent
  runEnd: RunEndEvent
  runStart: RunStartEvent
}

export interface EcosystemEventBase {
  source: GraphNode
}

export interface EdgeEvent extends EcosystemEventBase {
  action: 'add' | 'remove' | 'update'
  observer: GraphNode
  type: 'edge'
}

export interface ErrorEvent extends EcosystemEventBase {
  error: Error
  type: 'error'
}

export type EvaluationReason<G extends NodeGenerics = AnyNodeGenerics> =
  | ChangeEvent<G>
  | CycleEvent<G>
  | EventReceivedEvent<G>
  | InvalidateEvent<G>
  | PromiseChangeEvent<G>

export interface EventBase<G extends NodeGenerics = AnyNodeGenerics> {
  operation?: string // e.g. a method like "injectValue"
  reasons?: EvaluationReason[]
  source?: GraphNode<G>
}

export interface EventEmitter<G extends NodeGenerics = AnyNodeGenerics> {
  on<E extends keyof G['Events']>(
    eventName: E,
    callback: SingleEventListener<G, E>,
    config?: ListenerConfig
  ): Cleanup

  on(callback: CatchAllListener<G>, config?: ListenerConfig): Cleanup
}

export interface EventReceivedEvent<G extends NodeGenerics = AnyNodeGenerics>
  extends EventBase<G> {
  type: 'event'
}

/**
 * Events that can be sent manually. This is not the full list of events that
 * can be listened to on Zedux event emitters.
 *
 * @see ListenableEvents
 * @see SendableEvents
 */
export interface ExplicitEvents {
  /**
   * `mutate` events can be sent manually alongside a `.set` call to
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

/**
 * Events that Zedux creates internally and sends to listeners. You cannot
 * `.send()` these events manually.
 *
 * Not all of these apply to every node type. For example, only atoms will ever
 * send `promiseChange` events.
 */
export interface ImplicitEvents<G extends NodeGenerics = AnyNodeGenerics> {
  /**
   * Zedux sends this event whenever a GraphNode's value changes.
   */
  change: ChangeEvent<G>

  /**
   * When listening to a GraphNode, Zedux sends this event for the following
   * lifecycle status changes:
   *
   * - Active -> Stale
   * - Active -> Destroyed
   * - Stale -> Active
   * - Stale -> Destroyed
   *
   * When listening to the Ecosystem, Zedux also sends this event for:
   *
   * - Initializing -> Active
   *
   * (It isn't possible to attach an event listener to a GraphNode before it's
   * Active)
   */
  cycle: CycleEvent<G>

  /**
   * Zedux sends this event whenever `atomInstance.invalidate()` is called. Some
   * Zedux APIs hook into this event like `injectPromise`'s `runOnInvalidate`
   * option.
   */
  invalidate: InvalidateEvent<G>

  /**
   * Zedux sends this event when an atom instance's `.promise` reference changed
   * on a reevaluation. This essentially makes an atom's `.promise` another
   * piece of its state - all Zedux's injectors, atom getters, and React hooks
   * will cause a reevaluation/rerender when this event fires.
   */
  promiseChange: PromiseChangeEvent<G>
}

export interface InvalidateEvent<G extends NodeGenerics = AnyNodeGenerics>
  extends EventBase<G> {
  type: 'invalidate'
}

export type ListenableEvents<G extends NodeGenerics = AnyNodeGenerics> =
  Prettify<G['Events'] & ExplicitEvents & ImplicitEvents<G>>

export type Mutatable<State> =
  | RecursivePartial<State>
  | ((state: State) => void | RecursivePartial<State>)

export type MutatableTypes = any[] | Record<string, any> | Set<any>

export interface PromiseChangeEvent<G extends NodeGenerics = AnyNodeGenerics>
  extends EventBase<G> {
  type: 'promiseChange'
}

export interface ResetEndEvent extends ResetEventBase {
  type: 'resetEnd'
}

export interface ResetStartEvent extends ResetEventBase {
  type: 'resetStart'
}

export interface ResetEventBase {
  /**
   * Whether `ecosystem.reset` was called with `hydration: true`, removing any
   * previous hydrations set via `ecosystem.hydrate`
   */
  hydration?: boolean

  /**
   * Whether `ecosystem.reset` was called with `listeners: true`, removing
   * ecosystem event listeners registered via `ecosystem.on`
   */
  listeners?: boolean

  /**
   * Whether `ecosystem.reset` was called with `overrides: true`, removing any
   * overrides previously set via
   * `ecosystem.setOverrides`/`ecosystem.addOverrides`
   */
  overrides?: boolean
}

export interface RunEndEvent extends EcosystemEventBase {
  type: 'runEnd'
}

export interface RunStartEvent extends EcosystemEventBase {
  type: 'runStart'
}

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
   * `k`ey - either a top-level object key or an array of keys detailing the
   * "path" through a nested state object to the field that updated.
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
