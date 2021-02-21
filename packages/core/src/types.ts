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

export type ActionCreator<Payload = any, Type extends string = string> = (
  payload: Payload
) => Action<Payload, Type>

export type ActionCreatorEmpty<Type extends string = string> = () => Action<
  Type,
  undefined
>

export interface ActionMeta<
  Payload = any,
  Type extends string = string,
  Data = any
> {
  metaType: string
  metaData?: Data
  payload: ActionChain<Payload, Type>
}

export type ActionType = string

export type Actor<Payload = any, Type extends string = string> = {
  type: Type
} & ActionCreator<Payload, Type>

export type ActorEmpty<Type extends string = string> = {
  type: Type
} & ActionCreatorEmpty<Type>

export type Branch<T = any> = {
  [P in keyof T]: HierarchyDescriptor<T[P]>
}

export type Composable<T = any> = (arg: T) => T

export type Dispatchable = ActionChain // Just an ActionChain for now. May include Thunks in a future release!

export type Dispatcher<State = any> = (dispatchable: Dispatchable) => State

export interface Effect<Payload = any> {
  effectType: EffectType
  payload?: Payload
}

export type EffectChain<Payload = any> = EffectMeta<Payload> | Effect<Payload>

export type EffectCreator<State = any> = (
  state: State,
  action: Action
) => EffectChain[]

export interface EffectData<State = any> {
  action?: ActionChain
  effect?: EffectChain
  error?: Error
  newState: State
  oldState?: State
  store: Store<State>
}

export interface EffectMeta<Payload = any, Data = any> {
  metaType: string
  metaData?: Data
  payload: EffectChain<Payload>
}

export type EffectType = string

export type EffectsSubscriber<State = any> = (
  effectData: EffectData<State>
) => any

export type ErrorSubscriber = (error: Error) => any

export interface HierarchyConfig<T = any> {
  clone?: (node: T) => T
  create?: () => T
  get?: (node: T, key: string) => any
  isNode?: (node: any) => boolean
  iterate?: (node: T, callback: (key: string, val: any) => void) => void
  set?: (node: T, key: string, val: any) => T
  size?: (node: T) => number
}

export type HierarchyDescriptor<State = any> =
  | Branch<State>
  | Store<State>
  | Reducer<State>
  | null

export type Inducer<State = any, PartialState extends Partial<State> = any> = (
  state: State
) => PartialState

export interface MachineHooksBuilder<State = any> {
  getSubscription(): Subscription
  onEnter(
    action: Reactable,
    subscriber: EffectsSubscriber<State>
  ): MachineHooksBuilder<State>
  onLeave(
    action: Reactable,
    subscriber: EffectsSubscriber<State>
  ): MachineHooksBuilder<State>
}

export type NextSubscriber<State = any> = (
  newState: State,
  prevState?: State
) => any

export interface Observable<State = any> {
  subscribe(subscriber: Subscriber<State>): Subscription
}

export type Processable<T> = Promise<T> | Iterator<T> | Observable<T>

export type Reactable<Payload = any, Type extends string = string> =
  | Actor<Payload, Type>
  | Type

export type RecursivePartial<T> = T extends Record<string, unknown>
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

export type Settable<State = any> =
  | ((state: State) => RecursivePartial<State>)
  | RecursivePartial<State>
  | Partial<State> // this shouldn't be necessary, but for some reason TS has problems sometimes without it

export interface MachineState<Type extends string = string> {
  transitions: Record<string, string>
  type: Type
}

export type MachineStateRepresentation<Type extends string = string> =
  | MachineState<Type>
  | Type

export type SideEffectHandler<State = any> = (
  effectData: EffectData<State>
) => any

export interface Store<State = any> extends Observable<State> {
  action$: { [Symbol.observable]: () => Observable<Action> }
  configureHierarchy(options: HierarchyConfig): Store<State>
  dispatch: Dispatcher<State>
  getRefCount(includeInternalSubscribers?: boolean): number
  getState(): State
  hydrate(newState?: State): Store<State>
  setState(settable: Settable<State>): State
  use(newHierarchy?: RecursivePartial<HierarchyDescriptor<State>>): Store<State>
  $$typeof: symbol
  [Symbol.observable]: () => Store<State>
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

export interface WhenBuilder<State = any> {
  machine: (getMachine?: (state: State) => string) => WhenMachineBuilder<State>
  receivesAction: {
    (actor: Reactable, sideEffect: SideEffectHandler<State>): WhenBuilder<State>
    (sideEffect: SideEffectHandler<State>): WhenBuilder<State>
  }
  receivesEffect: {
    (
      effect: EffectType,
      sideEffect: SideEffectHandler<State>
    ): WhenBuilder<State>
    (sideEffect: SideEffectHandler<State>): WhenBuilder<State>
  }
  stateChanges: (sideEffect: SideEffectHandler<State>) => WhenBuilder<State>
  stateMatches: (
    predicate: (state: State) => boolean,
    sideEffect: SideEffectHandler<State>
  ) => WhenBuilder<State>
  subscription: Subscription
}

export interface WhenMachineBuilder<State = any> extends WhenBuilder<State> {
  enters: (
    state: MachineStateRepresentation,
    sideEffect: SideEffectHandler<State>
  ) => WhenMachineBuilder<State>
  leaves: (
    state: MachineStateRepresentation,
    sideEffect: SideEffectHandler<State>
  ) => WhenMachineBuilder<State>
}

export type ZeduxActor<Payload = any, Type extends string = string> = {
  toString(): Type
} & Actor<Payload, Type>

export type ZeduxActorEmpty<Type extends string = string> = {
  toString(): Type
} & ActorEmpty<Type>

export interface ZeduxMachineState<Type extends string = string>
  extends MachineState<Type> {
  is(str: string): boolean
  on(
    actor: Reactable,
    targetState: MachineStateRepresentation
  ): ZeduxMachineState<Type>
}

export interface ZeduxReducer<State = any> extends Reducer<State> {
  reduce<Type extends string = string, Payload = any>(
    actor: Reactable<Payload, Type> | Reactable<Payload, Type>[], // TODO: allow multiple actions with different payload types
    reducer: SubReducer<State, Payload>
  ): ZeduxReducer<State>
}
