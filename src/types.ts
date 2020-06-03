export interface Action<Payload = any> {
  type: string
  payload?: Payload
}

export type ActionChain<Payload = any> = ActionMeta<Payload> | Action<Payload>

export type ActionCreator<Payload = any> = (
  payload?: Payload
) => Action<Payload>

export interface ActionMeta<Payload = any, Data = any> {
  metaType: string
  metaData?: Data
  payload: ActionChain<Payload>
}

export type ActionType = string

export interface Actor<Payload = any> extends ActionCreator<Payload> {
  type: string
}

export interface Branch {
  [key: string]: HierarchyDescriptor
}

export type Composable<T = any> = (arg: T) => T

export type Dispatchable<State = any> = ActionChain // Just an ActionChain for now. May include Thunks in a future release!

export type Dispatcher<State = any> = (
  dispatchable: Dispatchable<State>
) => DispatchResult<State>

export interface DispatchResult<State = any> {
  error?: Error | null
  state: State
}

export interface Effect<Payload = any> {
  effectType: string
  payload?: Payload
}

export type EffectChain<Payload = any> = EffectMeta<Payload> | Effect<Payload>

export type EffectCreator<State = any> = (
  state: State,
  action: Action
) => EffectChain[]

export interface EffectMeta<Payload = any, Data = any> {
  metaType: string
  metaData?: Data
  payload: EffectChain<Payload>
}

export type EffectsSubscriber<State = any> = (meta: {
  action: ActionChain
  effects: EffectChain[]
  error: Error
  newState: State
  oldState: State
  store: Store<State>
}) => void

export type ErrorSubscriber = (error: Error) => void

export interface HierarchyConfig<T = object> {
  clone?: (node: T) => T
  create?: () => T
  get?: (node: T, key: string) => any
  isNode?: (node: any) => boolean
  iterate?: (node: T, callback: (key: string, val: any) => void) => void
  set?: (node: T, key: string, val: any) => T
  size?: (node: T) => number
}

export type HierarchyDescriptor<State = any> =
  | Branch
  | Store<State>
  | Reducer<State>
  | null

export type Inducer<State = any, PartialState extends Partial<State> = any> = (
  state: State
) => PartialState

export type NextSubscriber<State = any> = (
  newState: State,
  prevState?: State
) => void

export interface Observable<State = any> {
  subscribe(subscriber: Subscriber<State>): Subscription
}

export type Processable<T> = Promise<T> | Iterator<T> | Observable<T>

export type Reactable<Payload = any> = Actor<Payload> | ActionType

export type ReactableList = Reactable | Reactable[]

export type RecursivePartial<T> = T extends object
  ? { [P in keyof T]?: RecursivePartial<T[P]> }
  : T

export type Reducer<State = any> = (
  state: State | undefined,
  action: Action
) => State

export type Selector<State = any, Derivation = any> = (
  state: State,
  ...args: any[]
) => Derivation

export type Settable<State = any> = RecursivePartial<State> | Inducer<State>

export interface Store<State = any> extends Observable<State> {
  configureHierarchy(options: HierarchyConfig): Store<State>
  dispatch: Dispatcher<State>
  getState(): State
  hydrate(newState?: State): Store<State>
  setState(settable: Settable<State>): DispatchResult<State>
  use(newHierarchy?: HierarchyDescriptor): Store<State>
  $$typeof: symbol
  // [Symbol.observable]: () => Store<State>
}

export type SubReducer<State = any, Payload = any> = (
  state: State,
  payload: Payload
) => State

export type Subscriber<State = any> =
  | NextSubscriber<State>
  | SubscriberObject<State>

export interface SubscriberObject<State = any> {
  next?: NextSubscriber<State>
  effects?: EffectsSubscriber<State>
  error?: ErrorSubscriber
}

export interface Subscription {
  unsubscribe(): void
}

export interface ZeduxActor<Payload = any> extends Actor<Payload> {
  toString(): string
}

export interface ZeduxMachine<State extends string = string>
  extends Reducer<State> {
  addTransition(fromState: Reactable, toState: Reactable): ZeduxMachine<State>
  addTransition(
    fromState: Reactable,
    transition: Reactable,
    toState: Reactable
  ): ZeduxMachine<State>
  addUndirectedTransitions(...states: Reactable[]): ZeduxMachine<State>
}

export interface ZeduxReducer<State = any> extends Reducer<State> {
  reduce<Payload = any>(
    actor: Actor<Payload> | [Actor<Payload>],
    reducer: SubReducer<State, Payload>
  ): ZeduxReducer<State>
  reduce<P1, P2>(
    actors: [Actor<P1>, Actor<P2>],
    reducer: SubReducer<State, P1 | P2>
  ): ZeduxReducer<State>
  reduce<P1, P2, P3>(
    actors: [Actor<P1>, Actor<P2>, Actor<P3>],
    reducer: SubReducer<State, P1 | P2 | P3>
  ): ZeduxReducer<State>
  reduce<P1, P2, P3, P4>(
    actors: [Actor<P1>, Actor<P2>, Actor<P3>, Actor<P4>],
    reducer: SubReducer<State, P1 | P2 | P3 | P4>
  ): ZeduxReducer<State>
  reduce<P1, P2, P3, P4, P5>(
    actors: [Actor<P1>, Actor<P2>, Actor<P3>, Actor<P4>, Actor<P5>],
    reducer: SubReducer<State, P1 | P2 | P3 | P4 | P5>
  ): ZeduxReducer<State>
  reduce(actor: ReactableList, reducer: SubReducer<State>): ZeduxReducer<State>
}
