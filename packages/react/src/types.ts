import { Context } from 'react'
import { Dispatcher, Store } from '@zedux/core'
import { EvaluationReason, InjectorDescriptor } from './utils/types'

// Base Atom Types
export type AtomConfig<State = any, Params extends any[] = []> =
  | ReadonlyGlobalAtomConfig<State, Params>
  | GlobalAtomConfig<State, Params>
  | ReadonlyAppAtomConfig<State, Params>
  | AppAtomConfig<State, Params>
  | ReadonlyLocalAtomConfig<State, Params>
  | LocalAtomConfig<State, Params>

export type Atom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> = ReadonlyAtom<State, Params, Methods> | ReadWriteAtom<State, Params, Methods>

export type ReadonlyAtom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> =
  | ReadonlyAppAtom<State, Params, Methods>
  | ReadonlyGlobalAtom<State, Params, Methods>
  | ReadonlyLocalAtom<State, Params, Methods>

export type ReadWriteAtom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> =
  | AppAtom<State, Params, Methods>
  | GlobalAtom<State, Params, Methods>
  | LocalAtom<State, Params, Methods>

export type AtomInstance<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> =
  | ReadWriteAtomInstance<State, Params, Methods>
  | ReadonlyAtomInstance<State, Params, Methods>

export type ReadWriteAtomInstance<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> =
  | AppAtomInstance<State, Params, Methods>
  | GlobalAtomInstance<State, Params, Methods>
  | LocalAtomInstance<State, Params, Methods>

export type ReadonlyAtomInstance<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> =
  | ReadonlyAppAtomInstance<State, Params, Methods>
  | ReadonlyGlobalAtomInstance<State, Params, Methods>
  | ReadonlyLocalAtomInstance<State, Params, Methods>

export type SharedAtomConfigOptions = 'flags' | 'key' | 'value'
export type SharedTtlAtomConfigOptions = SharedAtomConfigOptions | 'ttl'

export interface AtomBase<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>,
  ScopeType extends Scope = Scope,
  Readonly extends boolean = boolean,
  AtomType extends Atom<State, Params, Methods> = Atom<State, Params, Methods>,
  InstanceType extends AtomInstance<State, Params, Methods> = AtomInstance<
    State,
    Params,
    Methods
  >
> extends AtomBaseProperties<
    State,
    Params,
    Methods,
    ScopeType,
    Readonly,
    InstanceType
  > {
  injectInstance: (
    ...params: Params
  ) => Readonly extends true
    ? ReadonlyAtomInstanceInjectorApi<State, Params, Methods>
    : ReadWriteAtomInstanceInjectorApi<State, Params, Methods>
  injectInvalidate: (...params: Params) => () => void
  injectLazy: () => (...params: Params) => Store<State>
  injectMethods: (...params: Params) => Methods
  injectSelector: Params extends []
    ? <D = any>(selector: (state: State) => D) => D
    : <D = any>(params: Params, selector: (state: State) => D) => D
  injectValue: (...params: Params) => State
  override: (
    newValue: AtomValue<State> | ((...params: Params) => AtomValue<State>)
  ) => AtomType
  useConsumer: () => InstanceType
  useInstance: (
    ...params: Params
  ) => Readonly extends true
    ? ReadonlyAtomInstanceReactApi<State, Params, Methods>
    : ReadWriteAtomInstanceReactApi<State, Params, Methods>
  useInvalidate: (...params: Params) => () => void
  useLazy: () => (...params: Params) => Store<State>
  useMethods: (...params: Params) => Methods
  useSelector: Params extends []
    ? <D = any>(selector: (state: State) => D) => D
    : <D = any>(params: Params, selector: (state: State) => D) => D
  useValue: (...params: Params) => State
}

export interface AtomBaseProperties<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>,
  ScopeType extends Scope = Scope,
  Readonly extends boolean = boolean,
  InstanceType extends AtomInstance<State, Params, Methods> = AtomInstance<
    State,
    Params,
    Methods
  >
> {
  flags?: string[]
  getReactContext: () => Context<InstanceType>
  internalId: string
  key: string
  // molecules?: Molecule[]
  readonly?: Readonly
  scope: ScopeType
  ttl?: Ttl
  value: AtomValue<State> | ((...params: Params) => AtomValue<State>)
}

export interface AtomInstanceBase<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> {
  activeState: ActiveState
  dependencies: Record<string, string>
  destructionTimeout?: ReturnType<typeof setTimeout>
  getEvaluationReasons: () => EvaluationReason[]
  implementationId: string
  injectMethods: () => Methods
  injectValue: () => State
  injectors: InjectorDescriptor[]
  internalId: string
  invalidate: (reason: EvaluationReason) => void
  key: string
  keyHash: string
  Provider: React.ComponentType
  params: Params
  stateStore: Store<State>
  stateType: StateType
  useMethods: () => Methods
  useValue: () => State // Not for local atoms
}

export interface ReadWriteAtomInstanceReactApi<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> extends Pick<
    AtomInstanceBase<State, Params, Methods>,
    'useMethods' | 'useValue'
  > {
  useState: () => ReturnType<StateHook<State>>
}

export interface ReadWriteAtomInstanceInjectorApi<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> extends Pick<
    AtomInstanceBase<State, Params, Methods>,
    'injectMethods' | 'injectValue'
  > {
  injectState: () => ReturnType<StateInjector<State>>
}

export type ReadonlyAtomInstanceReactApi<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> = Pick<
  AtomInstanceBase<State, Params, Methods>,
  'Provider' | 'useMethods' | 'useValue'
>

export type ReadonlyAtomInstanceInjectorApi<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> = Pick<
  AtomInstanceBase<State, Params, Methods>,
  'injectMethods' | 'injectValue'
>

// App Atoms
export interface AppAtomConfig<State = any, Params extends any[] = []>
  extends Pick<AppAtom<State, Params>, SharedTtlAtomConfigOptions> {
  readonly?: false
  scope?: Scope.App
}

export interface ReadonlyAppAtomConfig<State = any, Params extends any[] = []>
  extends Pick<ReadonlyAppAtom<State, Params>, SharedTtlAtomConfigOptions> {
  readonly: true
  scope?: Scope.App
}

export interface AppAtom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> extends AtomBase<
    State,
    Params,
    Methods,
    Scope.App,
    false,
    AppAtom<State, Params, Methods>,
    AppAtomInstance<State, Params, Methods>
  > {
  injectDispatch: (...params: Params) => Dispatcher<State>
  injectState: StateInjector<State, Params>
  injectStore: (...params: Params) => Store<State>
  useDispatch: (...params: Params) => Dispatcher<State>
  useState: StateHook<State, Params>
  useStore: (...params: Params) => Store<State>
}

export type ReadonlyAppAtom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> = AtomBase<
  State,
  Params,
  Methods,
  Scope.App,
  true,
  ReadonlyAppAtom<State, Params, Methods>,
  ReadonlyAppAtomInstance<State, Params, Methods>
>

export type AppAtomInstance<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> = AtomInstanceBase<State, Params, Methods>

export type ReadonlyAppAtomInstance<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> = AtomInstanceBase<State, Params, Methods>

// Global Atoms
export interface GlobalAtomConfig<State = any, Params extends any[] = []>
  extends Pick<GlobalAtom<State, Params>, SharedTtlAtomConfigOptions> {
  readonly?: false
  scope: Scope.Global
}

export interface ReadonlyGlobalAtomConfig<
  State = any,
  Params extends any[] = []
> extends Pick<ReadonlyGlobalAtom<State, Params>, SharedTtlAtomConfigOptions> {
  readonly: true
  scope: Scope.Global
}

export interface GlobalAtom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> extends AtomBase<
    State,
    Params,
    Methods,
    Scope.Global,
    false,
    GlobalAtom<State, Params, Methods>,
    GlobalAtomInstance<State, Params, Methods>
  > {
  injectDispatch: (...params: Params) => Dispatcher<State>
  injectState: StateInjector<State, Params>
  injectStore: (...params: Params) => Store<State>
  useDispatch: (...params: Params) => Dispatcher<State>
  useState: StateHook<State, Params>
  useStore: (...params: Params) => Store<State>
}

export type ReadonlyGlobalAtom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> = AtomBase<
  State,
  Params,
  Methods,
  Scope.Global,
  true,
  ReadonlyGlobalAtom<State, Params, Methods>,
  ReadonlyGlobalAtomInstance<State, Params, Methods>
>

export type GlobalAtomInstance<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> = AtomInstanceBase<State, Params, Methods>

export type ReadonlyGlobalAtomInstance<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> = AtomInstanceBase<State, Params, Methods>

// Local Atoms
export interface LocalAtomConfig<State = any, Params extends any[] = []>
  extends Pick<LocalAtom<State, Params>, SharedAtomConfigOptions> {
  readonly?: false
  scope: Scope.Local
  ttl?: 0
}

export interface ReadonlyLocalAtomConfig<State = any, Params extends any[] = []>
  extends Pick<ReadonlyLocalAtom<State, Params>, SharedAtomConfigOptions> {
  readonly: true
  scope: Scope.Local
  ttl?: 0
}

export interface LocalAtom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> extends AtomBase<
    State,
    Params,
    Methods,
    Scope.Local,
    false,
    LocalAtom<State, Params, Methods>,
    LocalAtomInstance<State, Params, Methods>
  > {
  injectDispatch: (...params: Params) => Dispatcher<State>
  injectState: StateInjector<State, Params>
  injectStore: (...params: Params) => Store<State>
  ttl?: 0
  useDispatch: (...params: Params) => Dispatcher<State>
  useState: StateHook<State, Params>
  useStore: (...params: Params) => Store<State>
}

export interface ReadonlyLocalAtom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> extends AtomBase<
    State,
    Params,
    Methods,
    Scope.Local,
    true,
    ReadonlyLocalAtom<State, Params, Methods>,
    ReadonlyLocalAtomInstance<State, Params, Methods>
  > {
  ttl?: 0
}

export type LocalAtomInstance<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> = AtomInstanceBase<State, Params, Methods>

export type ReadonlyLocalAtomInstance<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> = AtomInstanceBase<State, Params, Methods>

// Other

export enum ActiveState {
  Active = 'Active',
  Destroyed = 'Destroyed',
  Destroying = 'Destroying',
}

/**
 * AtomContext
 *
 * An interface for creating `AtomContextInstance`s.
 *
 * Atom context is an escape hatch. The primary purpose is to help with
 * integrating Zedux into existing codebases - codebases where Zedux is not the
 * main state management tool. The flow for using atom context is similar to
 * React context:
 *
 * create atom context -> instantiate -> provide instance -> consume instance
 *
 * To create an atom context, use the `atomContext()` factory.
 *
 * To instantiate an atom context, use `myAtomContext.useInstance()`.
 *
 * To provide an atom context instance, pass it to an AppProvider via the
 * `contexts` prop.
 *
 * To consume a provided atom context instance, use
 * `myAtomContext.useConsumer()` in a component or
 * `myAtomContext.injectConsumer()` in an app or local atom.
 *
 * Example usage:
 *
 * ```ts
 * import { AppProvider, atomContext } from '@zedux/react'
 *
 * // create
 * const reduxAtomContext = atomContext<RootReduxState>()
 *
 * function App() {
 *   const initialState = useSelector(s => s, () => true)
 *   const instance = reduxAtomContext.useInstance(initialState) // instantiate
 *
 *   // provide
 *   return <AppProvider contexts={[instance]}><Child /></AppProvider>
 * }
 *
 * function Child() {
 *   const instance = reduxAtomContext.useConsumer() // consume (hook)
 *   ...
 * }
 *
 * const childAtom = atom('child', () => {
 *   const instance = reduxAtomContext.injectConsumer() // consume (injector)
 *   ...
 * })
 * ```
 */
export interface AtomContext<T = any> {
  /**
   * AtomContext#injectConsumer()
   *
   * The injector version of `AtomContext#useConsumer()`. For use in atoms.
   */
  injectConsumer: () => AtomContextInstanceInjectorApi<T>

  /**
   * AtomContext#injectDispatch()
   *
   * The injector version of `AtomContext#useDispatch()`. For use in atoms.
   */
  injectDispatch: () => Dispatcher<T>

  /**
   * AtomContext#injectSelector()
   *
   * The injector version of `AtomContext#useSelector()`. For use in atoms.
   */
  injectSelector: <D = any>(selector: (state: T) => D) => D

  /**
   * AtomContext#injectSetState()
   *
   * The injector version of `AtomContext#useSetState()`. For use in atoms.
   */
  injectSetState: () => Store<T>['setState']

  /**
   * AtomContext#injectState()
   *
   * The injector version of `AtomContext#useState()`. For use in atoms.
   */
  injectState: () => readonly [T, Store<T>['setState']]

  /**
   * AtomContext#injectStore()
   *
   * The injector version of `AtomContext#useStore()`. For use in atoms.
   */
  injectStore: () => Store<T>

  /**
   * AtomContext#injectValue()
   *
   * The injector version of `AtomContext#useValue()`. For use in atoms.
   */
  injectValue: () => T

  /**
   * AtomContext#storeFactory
   *
   * A reference to the store factory passed to `atomContext(storeFactory)`. If
   * no factory was passed, defaults to
   *
   * ```ts
   * (initialState: T) => createStore<T>(null, initialState)
   * ```
   */
  storeFactory: (initialState?: T) => Store<T>

  /**
   * AtomContext#useConsumer()
   *
   * Finds the nearest instance of this AtomContext that has been provided by a
   * parent AppProvider. If no such AppProvider is found, a default instance is
   * created and added to the global atom ecosystem. If a default instance has
   * already been added to the global ecosystem, that instance will be reused.
   *
   * Does **not** subscribe to the instance's store, unless a subscribing hook
   * on the instance is used.
   *
   * ```ts
   * const instance = myAtomContext.useConsumer() // <- does not subscribe
   * const value = instance.useValue() // <- subscribes
   * ```
   *
   * All other AtomContext hooks (except `.useInstance()`) are shorthands for
   * `myAtomContext.useConsumer().use*()`
   */
  useConsumer: () => AtomContextInstanceReactApi<T>

  /**
   * AtomContext#useDispatch()
   *
   * Returns the `dispatch` function of the store of a provided instance of this
   * AtomContext.
   *
   * Does **not** subscribe to the instance's store.
   *
   * Essentially a shorthand for:
   *
   * ```ts
   * const instance = myAtomContext.useConsumer()
   * const dispatch = instance.useDispatch()
   * ```
   */
  useDispatch: () => Dispatcher<T>

  /**
   * AtomContext#useInstance()
   *
   * Creates an instance of this context. This is the only way to instantiate
   * the context. Every time this hook is used, another instance is created.
   *
   * To provide this AtomContext to the app, the returned instance must be
   * passed to an AppProvider via the `contexts` prop.
   *
   * Does **not** subscribe to the instance's store.
   *
   * Example:
   *
   * ```tsx
   * const instance = myAtomContext.useInstance('initial data here')
   *
   * return <AppProvider contexts={[instance]}>...</AppProvider>
   * ```
   */
  useInstance: (initialState: T) => AtomContextInstance<T>

  /**
   * AtomContext#useSelector()
   *
   * Returns the result of calling `selector(state)` where `state` is the
   * current state of a provided instance of this AtomContext.
   *
   * Also ensures that this component is only rerendered when the selected state
   * changes.
   *
   * Subscribes to the instance's store.
   *
   * Essentially a shorthand for:
   *
   * ```ts
   * const instance = myAtomContext.useConsumer()
   * const derivedState = instance.useSelector(mySelector)
   * ```
   */
  useSelector: <D = any>(selector: (state: T) => D) => D

  /**
   * AtomContext#useSetState()
   *
   * Returns the `setState` function of the store of a provided instance of this
   * AtomContext.
   *
   * Does **not** subscribe to the instance's store.
   *
   * Essentially a shorthand for:
   *
   * ```ts
   * const instance = myAtomContext.useConsumer()
   * const setState = instance.useSetState()
   * ```
   */
  useSetState: () => Store<T>['setState']

  /**
   * AtomContext#useState()
   *
   * Returns a tuple of [currentState, setState] for a provided instance of this
   * AtomContext.
   *
   * Subscribes to the instance's store.
   *
   * Essentially a shorthand for:
   *
   * ```ts
   * const instance = myAtomContext.useConsumer()
   * const [state, setState] = instance.useState()
   * ```
   */
  useState: () => readonly [T, Store<T>['setState']]

  /**
   * AtomContext#useStore()
   *
   * Returns the store of a provided instance of this AtomContext.
   *
   * Does **not** subscribe to the instance's store.
   *
   * Essentially a shorthand for:
   *
   * ```ts
   * const instance = myAtomContext.useConsumer()
   * const store = instance.useStore()
   * ```
   */
  useStore: () => Store<T>

  /**
   * AtomContext#useValue()
   *
   * Returns the current state of the store of a provided instance of this
   * AtomContext.
   *
   * Subscribes to the instance's store.
   *
   * Essentially a shorthand for:
   *
   * ```ts
   * const instance = myAtomContext.useConsumer()
   * const state = instance.useValue()
   * ```
   */
  useValue: () => T
}

export interface AtomContextInstance<T = any>
  extends AtomContextInstanceInjectorApi<T>,
    AtomContextInstanceReactApi<T> {
  atomContext: AtomContext<T>
}

export interface AtomContextInstanceInjectorApi<T = any> {
  injectDispatch: () => Dispatcher<T>
  injectSelector: <D = any>(selector: (state: T) => D) => D
  injectSetState: () => Store<T>['setState']
  injectState: () => readonly [T, Store<T>['setState']]
  injectStore: () => Store<T>
  injectValue: () => T
}

export interface AtomContextInstanceReactApi<T = any> {
  useDispatch: () => Dispatcher<T>
  useSelector: <D = any>(selector: (state: T) => D) => D
  useSetState: () => Store<T>['setState']
  useState: () => readonly [T, Store<T>['setState']]
  useStore: () => Store<T>
  useValue: () => T
}

export type AtomValue<State = any> = State | Store<State>

export type StateHook<State = any, Params extends any[] = []> = (
  ...params: Params
) => readonly [State, Store<State>['setState']]

export type StateInjector<State = any, Params extends any[] = []> = (
  ...params: Params
) => readonly [State, Store<State>['setState'], Store<State>]

export enum StateType {
  Store,
  Value,
}

// TODO: Molecules are just atoms now (:exploding_head:)
export interface Molecule {
  key: string
}

export interface RefObject<T = any> {
  current: T | null
}

export enum Scope {
  App = 'App',
  Global = 'Global',
  Local = 'Local',
}

export type Ttl = number // | Observable<any> - not implementing observable ttl for now // Not for local atoms
