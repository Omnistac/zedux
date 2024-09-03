import { Store } from './api/createStore'

// Same workaround rxjs uses for Symbol.observable:
declare global {
  interface SymbolConstructor {
    readonly observable: symbol
  }
}
export declare const observable: string | symbol

export interface Action<
  Payload = any,
  Type extends string = string,
  Meta = any
> {
  meta?: Meta
  payload?: Payload
  type: Type
}

export type ActionChain<Payload = any, Type extends string = string> =
  | ActionMeta<Payload, Type>
  | Action<Payload, Type>

export type ActionCreator<
  Payload = any,
  Type extends string = string
> = Payload extends undefined
  ? () => Action<Payload, Type>
  : (payload: Payload) => Action<Payload, Type>

export type ActionFactory<
  Payload = any,
  Type extends string = string
> = ActionCreator<Payload, Type> & {
  type: Type
}

export type ActionFactoryPayloadType<A extends ActionFactory> =
  A extends ActionFactory<infer T> ? T : never

export type ActionFactoryActionType<A extends ActionFactory> =
  A extends ActionFactory<infer P, infer T> ? { payload: P; type: T } : never

export type ActionFactoryTypeType<A extends ActionFactory> =
  A extends ActionFactory<any, infer T> ? T : never

export interface ActionMeta<
  Payload = any,
  Type extends string = string,
  Data = any
> {
  metaType: string
  metaData?: Data
  meta?: undefined // to make this type compatible with Action type
  payload: ActionChain<Payload, Type>
  type?: undefined // to make this type compatible with Action type
}

export type ActionMetaType<A extends Action> = A extends Action<
  any,
  any,
  infer T
>
  ? T
  : never

export type ActionPayloadType<A extends Action> = A extends Action<infer T>
  ? T
  : never

export type ActionType = string

export type ActionTypeType<A extends Action> = A extends Action<any, infer T>
  ? T
  : never

export type Branch<T = any> = {
  [K in keyof T]: HierarchyDescriptor<T[K]>
}

export type Composable<T = any> = (arg: T) => T

export type Dispatchable = ActionChain

export type Dispatcher<State = any> = (dispatchable: Dispatchable) => State

export interface StoreEffect<
  State = any,
  S extends Store<State> = Store<State>
> {
  action: ActionChain
  error?: unknown
  newState: State
  oldState?: State
  store: S
}

export type EffectType = string

export type EffectsSubscriber<
  State = any,
  S extends Store<State> = Store<State>
> = (storeEffect: StoreEffect<State, S>) => any

export type ErrorSubscriber = (error: unknown) => any

export interface HierarchyConfig<T = any> {
  clone: (node: T) => T
  create: () => T
  get: (node: T, key: string) => any
  isNode: (node: any) => boolean
  iterate: (node: T, callback: (key: string, val: any) => void) => void
  set: (node: T, key: string, val: any) => T
  size: (node: T) => number
}

/**
 * Describes a store's dependency tree. A store can have any number of reducers
 * or child stores nested indefinitely.
 *
 * ```ts
 * import { createStore } from '@zedux/core'
 *
 * const store = createStore({
 *   a: {
 *     b: childStoreB,
 *     c: childStoreC,
 *     d: {
 *       e: reducerE,
 *     }
 *   }
 * })
 * ```
 */
export type HierarchyDescriptor<State = any> =
  | Branch<State>
  | Store<State>
  | Reducer<State>
  | null

export interface Job {
  /**
   * `W`eight - the weight of the node (for EvaluateGraphNode jobs).
   */
  W?: number

  /**
   * `F`lags - the EdgeFlags of the edge between the scheduled node and the node
   * that caused it to schedule an update (for UpdateExternalDependent jobs).
   */
  F?: number

  /**
   * `j`ob - the actual task to run.
   */
  j: () => void

  /**
   * `T`ype - the job type. Different types get different priorities in the
   * scheduler.
   *
   * 0 - UpdateStore
   * 1 - InformSubscribers
   * 2 - EvaluateGraphNode
   * 3 - UpdateExternalDependent
   * 4 - RunEffect
   */
  T: 0 | 1 | 2 | 3 | 4
}

/**
 * After a store is created, TS knows the hierarchy shape and we can be more
 * intelligent in e.g. the store's `.use()` method
 */
export type KnownHierarchyDescriptor<State = any> = State extends Record<
  any,
  any
>
  ? State extends any[]
    ? // arrays match the Record type but can't be `Branch`es
      Store<State> | Reducer<State> | null
    : Branch<State> | Store<State> | Reducer<State> | null
  : Store<State> | Reducer<State> | null

export type NextSubscriber<State = any> = (
  newState: State,
  prevState: State | undefined,
  action: ActionChain
) => any

export interface Observable<T = any> {
  subscribe(subscriber: (value: T) => any): Subscription
}

export type Reactable<Payload = any, Type extends string = any> =
  | ActionFactory<Payload, Type>
  | Type

export type RecursivePartial<T> = T extends Record<string, any>
  ? { [P in keyof T]?: RecursivePartial<T[P]> }
  : T

export type Reducer<State = any> = (
  state: State | undefined,
  action: Action
) => State

export interface Scheduler {
  scheduleNow(newJob: Job): void
}

export type Selector<State = any, Derivation = any> = (
  state: State
) => Derivation

export type SetState<State = any, PartialState extends Partial<State> = any> = (
  state: State
) => PartialState

export type Settable<State = any, StateIn = State> =
  | ((state: StateIn) => State)
  | State

export type StateSetter<State = any> = (settable: Settable<State>) => State

export type StoreStateType<S extends Store> = S extends Store<infer T>
  ? T
  : never

export type SubReducer<
  State = any,
  Payload = any,
  Type extends string = any,
  Meta = any
> = (
  state: State,
  payload: Payload,
  action: Action<Payload, Type, Meta>
) => State

export type Subscriber<State = any, S extends Store<any> = Store<any>> =
  | NextSubscriber<State>
  | SubscriberObject<State, S>

export interface SubscriberObject<
  State = any,
  S extends Store<State> = Store<State>
> {
  next?: NextSubscriber<State>
  effects?: EffectsSubscriber<State, S>
  error?: ErrorSubscriber
}

export interface Subscription {
  unsubscribe(): void
}

export interface ReducerBuilder<State = any> extends Reducer<State> {
  reduce<Type extends string = string, Payload = any>(
    reactable: Reactable<Payload, Type> | Reactable<Payload, Type>[], // TODO: allow multiple actions with different payload types
    reducer: SubReducer<State, Payload>
  ): ReducerBuilder<State>
}
