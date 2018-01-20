export interface Action {
  type: string
  payload?: any
}


export interface ActionCreator {
  (...args: any[]): Action
}


export interface Actor extends ActionCreator {
  type: ActionType
}


export interface Dispatcher<S = any> {
  (dispatchable: Dispatchable): S
}


export interface HierarchyDescriptor {
  [s: string]: HierarchyDescriptorNode
}


export interface Inducer<S = any, P = any> {
  (state: S): P
}


export interface Inspector {
  (storeBase: StoreBase, action: MetaChainNode): void
}


export interface MetaNode {
  metaType: string,
  metaPayload?: any,
  action: MetaChainNode
}


export interface NodeOptions<T = Object> {
  clone?: (node: T) => T
  create?: () => T
  get?: (node: T, key: string) => any
  set?: (node: T, key: string, val: any) => T
}


export interface Observable<S = any> {
  subscribe(subscriber: Subscriber<S>): Subscription
}


export interface Processor<S = any> {
  (dispatch: Dispatcher, action: Action, state: S): void
}


export interface Reactor<S = any> extends Reducer {
  process?: Processor<S>
}


export interface Reducer<S = any> {
  (state: S | undefined, action: Action): S
}


export interface Selector<S = any, D = any> {
  (state: S, ...args: any[]): D
}


export interface State extends Actor {
  enter?: Processor
  leave?: Processor
}


export interface Store<S = any> extends Observable<S> {
  dispatch: Dispatcher<S>
  getState(): S
  hydrate(newState: S): Store<S>
  inspect(inspector: Inspector): Store<S>
  setNodeOptions(options: NodeOptions): Store<S>
  setState(partialUpdate: any): S
  use(newHierarchy: HierarchyDescriptorNode): Store<S>
}


export interface StoreBase<S = any> {
  dispatch: Dispatcher<S>
  getState(): S
}


export interface Subscriber<S> {
  (prevState: S, newState: S): void
}


export interface Subscription {
  unsubscribe(): void
}


export interface ZeduxActor extends Actor {
  payload(payloadCreator: Function): void
}


export interface ZeduxMachine extends Reactor<string> {
  from(...states: Transitionable[]): ZeduxMachine
  to(...states: Transitionable[]): ZeduxMachine
  undirected(...states: Transitionable[]): ZeduxMachine
}


export interface ZeduxReactor<S = any> extends Reactor<S> {
  to(...actions: Reactable[]): ZeduxReactor<S>
  toEverything(): ZeduxReactor<S>
  withProcessors(...processors: Processor<S>[]): ZeduxReactor<S>
  withReducers(...reducers: Reducer[]): ZeduxReactor<S>
}


export interface ZeduxState extends State, ZeduxActor {
  onEnter(processor: Processor): ZeduxState
  onLeave(processor: Processor): ZeduxState
}


/**
  A factory for creating ZeduxActors

  @param actionType Will be the `type` property set on all
    actions created by the ZeduxActor.

  @returns A ZeduxActor that can be used to create actions
    of the given type.
*/
export interface act {
  (...actionTypeNodes: string[]): ZeduxActor
  namespace(...namespaceNodes: string[]):
    (...actionTypeNodes: string[]) => ZeduxActor
}


/**
  A functional programming utility.
  Composes single-argument functions together from right-to-left
  For example

    compose(f, g, h)(x)

  is equivalent to

    f(g(h(x)))

  When called with no arguments, returns the identity function.

  When called with one argument, returns the passed function as-is

  @template F The type of the single function when called
    with one argument
  @template C The type of the resulting, composite function.

  @returns A function that, when called, invokes the given
    functions from right to left. The signature of this function
    will be the signature of the right-most input function.
*/
export function compose<T>(): (arg: T) => T
export function compose<F = Function>(func: F): F
export function compose<C = (...args: any[]) => any>(...funcs: Function[]): C


/**
  A factory for creating stores

  @template S Root state object

  @returns {Store} An empty, not-yet-configured store
*/
export function createStore<S = any>(): Store<S>


/**
  A factory for creating ZeduxReactors

  @template S The state shape consumed and produced by this reactor

  @param {S} initialState The initial state that the ZeduxReactor's
    reducer should return on initialization.

  @returns {ZeduxReactor} A ZeduxReactor with no delegates.
*/
export function react<S = any>(initialState: S): ZeduxReactor<S>


/**
  A factory for creating ZeduxSelectors

  @template S The state shape consumed by this selector
  @template D The derivation of the input state that this selector produces

  @param {Selector} inputSelectors The input selectors
  @param calculator The calculator function that will receive as input.
    the result of all the selector dependencies and return the derived
    state.

  @returns A memoized Selector
*/
export interface select {
  <S = any, D = any>(
    calculator: (state: S) => D
  ): Selector<S, D>

  <S = any, D = any, D1 = any>(
    inputSelector1: Selector<S, D1>,
    calculator: (input1: D1) => D
  ): Selector<S, D>

  <S = any, D = any, D1 = any, D2 = any>(
    inputSelector1: Selector<S, D1>,
    inputSelector2: Selector<S, D2>,
    calculator: (input1: D1, input2: D2) => D
  ): Selector<S, D>

  <S = any, D = any, D1 = any, D2 = any, D3 = any>(
    inputSelector1: Selector<S, D1>,
    inputSelector2: Selector<S, D2>,
    inputSelector3: Selector<S, D3>,
    calculator: (input1: D1, input2: D2, input3: D3) => D
  ): Selector<S, D>

  <S = any, D = any, D1 = any, D2 = any, D3 = any, D4 = any>(
    inputSelector1: Selector<S, D1>,
    inputSelector2: Selector<S, D2>,
    inputSelector3: Selector<S, D3>,
    inputSelector4: Selector<S, D4>,
    calculator: (input1: D1, input2: D2, input3: D3, input4: D4) => D
  ): Selector<S, D>

  namespace(...namespaceNodes: string[]):
    (...actionTypeNodes: string[]) => select
}


/**
  A factory for creating ZeduxStates

  @param stateName The name of this state.
    A State is an actor. The stateName is the actor's `type` property.

  @returns A ZeduxState - an actor that specifies how it should be processed
*/
export function state(stateName: string): ZeduxState


/**
  A factory for creating ZeduxMachines

  @param initialState The starting state of the machine.
    Can be either a valid State or action type string.

  @returns A ZeduxMachine with no configured state transitions
*/
export function transition(initialState: Transitionable): ZeduxMachine


export type ActionType = string


export type Dispatchable = MetaChainNode | Inducer


export type HierarchyDescriptorNode
  = HierarchyDescriptor | Store | Reactor | null


export type MetaChainNode = MetaNode | Action


export type Reactable = Actor | ActionType


export type Transitionable = State | ActionType
