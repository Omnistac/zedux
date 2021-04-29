import { Context } from 'react'
import { Dispatcher, StateSetter, Store } from '@zedux/core'
import { EvaluationReason, InjectorDescriptor } from './utils/types'

export enum ActiveState {
  Active = 'Active',
  Destroyed = 'Destroyed',
  Destroying = 'Destroying',
}

export interface AsyncState<T> {
  data?: T
  error?: Error
  status: AsyncStatus
}

export enum AsyncStatus {
  Error = 'Error',
  Idle = 'Idle',
  Loading = 'Loading',
  Success = 'Success',
}

export type AsyncStore<T> = Store<AsyncState<T>>

export interface Atom<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends Omit<
    ReadonlyAtom<State, Params, Exports, AtomInstance<State, Params, Exports>>,
    'override' | 'readonly'
  > {
  injectDispatch: (...params: Params) => Dispatcher<State>
  injectSetState: (...params: Params) => StateSetter<State>
  injectState: (
    ...params: Params
  ) => readonly [State, Store<State>['setState'], Store<State>]
  injectStore: (...params: Params) => Store<State>
  override: (
    newValue: AtomValue<State> | ((...params: Params) => AtomValue<State>)
  ) => Atom<State, Params, Exports>
  readonly?: false
  useDispatch: (...params: Params) => Dispatcher<State>
  useSetState: (...params: Params) => StateSetter<State>
  useState: (...params: Params) => readonly [State, Store<State>['setState']]
  useStore: (...params: Params) => Store<State>
}

export interface AtomBaseProperties<
  State,
  Params extends any[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  InstanceType extends AtomInstanceBase<State, Params> = AtomInstanceBase<
    State,
    Params
  >
> {
  flags?: string[]
  internalId: string
  key: string
  type: AtomType
}

export interface AtomConfig {
  flags?: string[]
  maxInstances?: number
  molecules?: Molecule<any, any>[] // TODO: type this first `any` (the second `any` is correct as-is)
  readonly?: boolean
  ttl?: number
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
 * To provide an atom context instance, pass it to an EcosystemProvider via the
 * `contexts` prop.
 *
 * To consume a provided atom context instance, use
 * `myAtomContext.useConsumer()` in a component or
 * `myAtomContext.injectConsumer()` in an atom.
 *
 * Example usage:
 *
 * ```ts
 * import { EcosystemProvider, atomContext } from '@zedux/react'
 *
 * // create
 * const reduxAtomContext = atomContext<RootReduxState>()
 *
 * function App() {
 *   const initialState = useSelector(s => s, () => true)
 *   const instance = reduxAtomContext.useInstance(initialState) // instantiate
 *
 *   // provide
 *   return (
 *     <EcosystemProvider contexts={[instance]}><Child /></EcosystemProvider>
 *   )
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
   * parent EcosystemProvider. If no such EcosystemProvider is found, a default
   * instance is created and added to the global atom ecosystem. If a default
   * instance has already been added to the global ecosystem, that instance will
   * be reused.
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
   * To provide this AtomContext to the ecosystem, the returned instance must be
   * passed to an EcosystemProvider via the `contexts` prop.
   *
   * Does **not** subscribe to the instance's store.
   *
   * Example:
   *
   * ```tsx
   * const instance = myAtomContext.useInstance('initial data here')
   *
   * return <EcosystemProvider contexts={[instance]}>...</EcosystemProvider>
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

export interface AtomInstance<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends ReadonlyAtomInstance<State, Params, Exports> {
  dispatch: Dispatcher<State>
  injectState: () => readonly [State, Store<State>['setState'], Store<State>]
  setState: StateSetter<State>
  useState: () => readonly [State, Store<State>['setState']]
  store: Store<State>
}

export interface AtomInstanceBase<State, Params extends any[]> {
  internals: AtomInstanceInternals<State, Params>
}

export interface AtomInstanceInternals<State, Params extends any[]> {
  activeState: ActiveState
  atomInternalId: string
  destructionTimeout?: ReturnType<typeof setTimeout>
  getEvaluationReasons: () => EvaluationReason[]
  injectors: InjectorDescriptor[]
  keyHash: string
  params: Params
  scheduleDestruction: () => void
  scheduleEvaluation: (reason: EvaluationReason) => void
  stateStore: Store<State>
  stateType: StateType
}

export enum AtomType {
  External = 'External',
  Local = 'Local',
  Molecule = 'Molecule',
  Mutation = 'Mutation',
  Query = 'Query',
  Standard = 'Standard',
}

export type AtomValue<State = any> = State | Store<State>

export interface EcosystemProviderProps {
  atoms?: AtomBaseProperties<any, any[]>[]
  contexts?: AtomContextInstance[]
  flags?: string[]
  preload?: () => unknown
}

export interface EcosystemConfig
  extends Omit<EcosystemProviderProps, 'preload'> {
  destroyOnUnmount?: boolean
  id?: string
}

export type InjectOrUseSelector<State, Params extends any[]> = Params extends []
  ? <D = any>(selector: (state: State) => D) => D
  : <D = any>(params: Params, selector: (state: State) => D) => D

export interface LocalAtom<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends Omit<
    ReadonlyLocalAtom<
      State,
      Params,
      Exports,
      AtomInstance<State, Params, Exports>
    >,
    'override' | 'readonly'
  > {
  override: (
    newValue: AtomValue<State> | ((...params: Params) => AtomValue<State>)
  ) => LocalAtom<State, Params, Exports>
  readonly?: false
  useDispatch: () => Dispatcher<State>
  useSetState: () => StateSetter<State>
  useState: () => readonly [State, Store<State>['setState']]
  useStore: () => Store<State>
}

export type LocalAtomConfig = Omit<AtomConfig, 'maxInstances' | 'ttl'>

/**
 * Molecule
 *
 * A bidirectional accumulator of atoms. "Bidirectional" meaning it can inject
 * atoms and atoms can inject themselves. This is useful for code-split
 * codebases where some atoms are lazy-loaded and need to attach themselves
 * lazily.
 *
 * Molecules typically combine the stores of multiple atoms into a single store.
 * This can be used to persist and hydrate ecosystem state or implement
 * undo/redo and time travel debugging.
 *
 * Molecules are actually a type of atom. This means creating and using a
 * molecule is very similar to creating and using an atom. The API is only
 * slightly different.
 *
 * Example:
 *
 * ```ts
 * import { injectAllInstances, injectStore, molecule } from '@zedux/react'
 *
 * const formsMolecule = molecule('forms', () => {
 *   const store = injectStore(null, false)
 *
 *   // inject all instances of these 2 atoms into this molecule:
 *   injectAllInstances([loginFormAtom, registerFormAtom], (atom, instance) => {
 *     // Here we're assuming that both these atoms take no params.
 *     // So there will only be one instance. In general, don't assume this:
 *     store.use({ [atom.key]: instance.stateStore })
 *
 *     // remember to clean up on instance destroy
 *     return () => store.use({ [atom.key]: null })
 *   })
 *
 *   // allow any atom to inject itself into this molecule:
 *   injectAllInstances((atom, instance) => {
 *     // can't assume that the injected atom doesn't take params:
 *     store.use({ [atom.key]: { [instance.keyHash]: instance.stateStore } })
 *
 *     return () => store.use({ [atom.key]: null })
 *   })
 *
 *   return store
 * })
 * ```
 */
export interface Molecule<State, Exports extends Record<string, any>>
  extends AtomBaseProperties<State, []> {
  injectExports: () => Exports
  injectState: () => readonly [State, Store<State>['setState'], Store<State>]
  injectStore: () => Store<State>
  override: (newValue: () => AtomValue<State>) => Molecule<State, Exports>
  type: AtomType.Molecule
  useExports: () => Exports
  useState: () => readonly [State, Store<State>['setState']]
  useStore: () => Store<State>
  value: () => AtomValue<State>
}

export interface MoleculeInstance<State, Exports extends Record<string, any>>
  extends AtomInstanceBase<State, []> {
  exports: Exports
}

export interface Mutation<State, MutationParams extends any[]>
  extends Query<State, [], MutationAtomInstance<State, MutationParams>> {
  mutate: MutationAtomInstance<State, MutationParams>['mutate']
}

/**
 * MutationAtom
 *
 * Every time `.injectMutation()` or `.useMutation()` is used, a new instance is created.
 * There is therefore no need for useInvalidate or useCancel hooks (or injectors).
 * Use `mutation.invalidate()` or `mutation.cancel()`.
 *
 * TODO: Provide useInvalidateAll() and useCancelAll() hooks/injectors.
 */
export interface MutationAtom<State, MutationParams extends any[]>
  extends AtomBaseProperties<State, []> {
  getReactContext: () => Context<MutationAtomInstance<State, MutationParams>>
  injectMutation: () => Mutation<State, MutationParams>
  molecules?: Molecule<any, any> // TODO: type this first `any` (the second `any` is correct as-is)
  override: (
    newValue: () => (
      ...mutationParams: MutationParams
    ) => State | Promise<State>
  ) => MutationAtom<State, MutationParams>
  tts?: Scheduler
  ttl?: Scheduler
  type: AtomType.Mutation
  useMutation: () => Mutation<State, MutationParams>
  value: () => (...mutationParams: MutationParams) => State | Promise<State>
}

export interface MutationAtomInstance<State, MutationParams extends any[]>
  extends Omit<QueryAtomInstance<State, []>, 'run'> {
  mutate: (...mutationParams: MutationParams) => State | Promise<State>
  reset: () => void
}

export interface Query<
  State,
  Params extends any[],
  InstanceType extends Omit<
    QueryAtomInstance<State, Params>,
    'run'
  > = QueryAtomInstance<State, Params>
> {
  data?: State
  error?: Error
  instance: InstanceType
  isError: boolean
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  status: AsyncStatus
}

export interface QueryAtom<State, Params extends any[]>
  extends AtomBaseProperties<
    AsyncState<State>,
    Params,
    QueryAtomInstance<State, Params>
  > {
  getReactContext: () => Context<QueryAtomInstance<State, Params>>
  injectInstance: (...params: Params) => QueryAtomInstance<State, Params>
  injectLazy: () => (...params: Params) => QueryAtomInstance<State, Params>
  injectQuery: (...params: Params) => Query<State, Params>
  injectSelector: InjectOrUseSelector<State, Params>
  molecules?: Molecule<any, any> // TODO: type this first `any` (the second `any` is correct as-is)
  override: (
    newValue: (...params: Params) => () => State | Promise<State>
  ) => QueryAtom<State, Params>
  runOnWindowFocus?: boolean
  tts?: Scheduler
  ttl?: Scheduler
  type: AtomType.Query
  useConsumer: () => QueryAtomInstance<State, Params>
  useInstance: (...params: Params) => QueryAtomInstance<State, Params>
  useLazy: () => (...params: Params) => QueryAtomInstance<State, Params>
  useQuery: (...params: Params) => Query<State, Params>
  useSelector: InjectOrUseSelector<State, Params>
  value: (...params: Params) => () => State | Promise<State>
}

export interface QueryAtomInstance<State, Params extends any[]>
  extends AtomInstanceBase<AsyncState<State>, Params> {
  cancel: () => void
  invalidate: () => void
  Provider: React.ComponentType
  run: () => State | Promise<State>
  store: AsyncStore<State>
}

export interface ReadonlyAtomInstance<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends AtomInstanceBase<State, Params> {
  exports: Exports
  injectSelector: <D = any>(selector: (state: State) => D) => D
  injectValue: () => State
  invalidate: () => void
  Provider: React.ComponentType
  useSelector: <D = any>(selector: (state: State) => D) => D
  useValue: () => State
}

export interface ReadonlyLocalAtom<
  State,
  Params extends any[],
  Exports extends Record<string, any>,
  InstanceType extends ReadonlyAtomInstance<
    State,
    Params,
    Exports
  > = ReadonlyAtomInstance<State, Params, Exports>
> extends AtomBaseProperties<State, Params, InstanceType> {
  getReactContext: () => Context<InstanceType>
  injectInstance: (...params: Params) => InstanceType
  molecules?: Molecule<any, any>[] // TODO: type this first `any` (the second `any` is correct as-is)
  override: (
    newValue: AtomValue<State> | ((...params: Params) => AtomValue<State>)
  ) => ReadonlyLocalAtom<State, Params, Exports, InstanceType>
  readonly: true
  type: AtomType.Local
  useConsumer: () => InstanceType
  useExports: () => Exports
  useInstance: (...params: Params) => InstanceType
  useSelector: <D = any>(selector: (state: State) => D) => D
  useValue: () => State
  value: AtomValue<State> | ((...params: Params) => AtomValue<State>)
}

export interface ReadonlyAtom<
  State,
  Params extends any[],
  Exports extends Record<string, any>,
  InstanceType extends ReadonlyAtomInstance<
    State,
    Params,
    Exports
  > = ReadonlyAtomInstance<State, Params, Exports>
> extends AtomBaseProperties<State, Params, InstanceType> {
  getReactContext: () => Context<InstanceType>
  injectExports: (...params: Params) => Exports
  injectInstance: (...params: Params) => InstanceType
  injectInvalidate: (...params: Params) => () => void
  injectLazy: () => (...params: Params) => InstanceType
  injectSelector: InjectOrUseSelector<State, Params>
  injectValue: (...params: Params) => State
  maxInstances?: number
  molecules?: Molecule<any, any>[] // TODO: type this first `any`
  override: (
    newValue: AtomValue<State> | ((...params: Params) => AtomValue<State>)
  ) => ReadonlyAtom<State, Params, Exports, InstanceType>
  readonly: true
  ttl?: Scheduler
  type: AtomType.Standard
  useConsumer: () => InstanceType
  useExports: (...params: Params) => Exports
  useInstance: (...params: Params) => InstanceType
  useInvalidate: (...params: Params) => () => void
  useLazy: () => (...params: Params) => InstanceType
  useSelector: InjectOrUseSelector<State, Params>
  useValue: (...params: Params) => State
  value: AtomValue<State> | ((...params: Params) => AtomValue<State>)
}

export interface RefObject<T = any> {
  current: T | null
}

export enum StateType {
  Store,
  Value,
}

export type Scheduler = number // | Observable<any> | (store: Store<T>) => Observable<any> - not implementing observable ttl for now
