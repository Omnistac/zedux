import { Store } from './api/createStore'
import { MachineStore } from './api/MachineStore'
import { MachineStateType } from './utils/types'

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

export type ActionFactoryPayloadType<
  A extends ActionFactory
> = A extends ActionFactory<infer T> ? T : never

export type ActionFactoryActionType<
  A extends ActionFactory
> = A extends ActionFactory<infer P, infer T> ? { payload: P; type: T } : never

export type ActionFactoryTypeType<
  A extends ActionFactory
> = A extends ActionFactory<any, infer T> ? T : never

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

export type Dispatchable = ActionChain // Just an ActionChain for now. Could include thunks but probably won't happen.

export type Dispatcher<State = any> = (dispatchable: Dispatchable) => State

export interface StoreEffect<
  State = any,
  S extends Store<State> = Store<State>
> {
  action?: ActionChain
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

export type HierarchyDescriptor<State = any> =
  | Branch<State>
  | Store<State>
  | Reducer<State>
  | null

export type MachineHook<
  StateNames extends string,
  EventNames extends string,
  Context extends Record<string, any> | undefined
> = (
  store: MachineStore<StateNames, EventNames, Context>,
  storeEffect: StoreEffect<
    MachineStateType<StateNames, Context>,
    MachineStore<StateNames, EventNames, Context>
  >
) => void

export type MachineStoreContextType<
  M extends MachineStore
> = M extends MachineStore<any, any, infer C> ? C : never

export type MachineStoreEventNamesType<
  M extends MachineStore
> = M extends MachineStore<any, infer E, any> ? E : never

export type MachineStoreStateType<
  M extends MachineStore
> = M extends MachineStore<infer S, any, infer C>
  ? MachineStateType<S, C>
  : never

export type MachineStoreStateNamesType<
  M extends MachineStore
> = M extends MachineStore<infer S, any, any> ? S : never

export type NextSubscriber<State = any> = (
  newState: State,
  prevState: State | undefined,
  action: ActionChain
) => any

export interface Observable<State = any> {
  subscribe(subscriber: Subscriber<Store<State>>): Subscription
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
