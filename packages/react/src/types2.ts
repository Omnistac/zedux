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

export interface AtomBaseProperties {
  flags?: string[]
  internalId: string
  key: string
}

export interface AtomInstance<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends AtomInstanceBaseProperties<Params> {
  activeState: ActiveState
  dependencies: Record<string, string>
  destructionTimeout?: ReturnType<typeof setTimeout>
  getEvaluationReasons: () => EvaluationReason[]
  injectExports: () => Exports
  injectValue: () => State
  injectors: InjectorDescriptor[]
  invalidate: (reason: EvaluationReason) => void
  Provider: React.ComponentType
  stateStore: Store<State>
  stateType: StateType
  useExports: () => Exports
  useValue: () => State // Not for local atoms
}

export interface AtomInstanceApi<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends ReadonlyAtomInstanceApi<State, Params, Exports> {
  injectDispatch: () => Dispatcher<State>
  injectSetState: () => StateSetter<State>
  injectState: () => readonly [State, Store<State>['setState'], Store<State>]
  injectStore: () => Store<State>
  useDispatch: () => Dispatcher<State>
  useSetState: () => StateSetter<State>
  useState: () => readonly [State, Store<State>['setState']]
  useStore: () => Store<State>
}

export interface AtomInstanceBaseProperties<Params extends any[]>
  extends AtomBaseProperties {
  atomInternalId: string
  keyHash: string
  params: Params
}

export type AtomValue<State = any> = State | Store<State>

export type InjectOrUseSelector<State, Params extends any[]> = Params extends []
  ? <D = any>(selector: (state: State) => D) => D
  : <D = any>(params: Params, selector: (state: State) => D) => D

export interface LocalAtom<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends ReadonlyLocalAtom<State, Params, Exports> {
  useDispatch: () => Dispatcher<State>
  useSetState: () => StateSetter<State>
  useState: () => readonly [State, Store<State>['setState']]
  useStore: () => Store<State>
}

/**
 * Molecule
 *
 * A bidirectional accumulator of atoms. "Bidirectional" meaning it can inject
 * atoms and atoms can inject themselves. This is useful for code-split
 * codebases where some atoms are lazy-loaded and need to attach themselves
 * lazily.
 *
 * Molecules typically combine the stores of multiple atoms into a single store.
 * This can be used to persist and hydrate app state or implement undo/redo and
 * time travel debugging.
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
  extends AtomBaseProperties {
  injectExports: () => Exports
  injectInvalidate: () => () => void
  injectSelector: <D = any>(selector: (state: State) => D) => D
  injectState: () => readonly [State, Store<State>['setState'], Store<State>]
  injectStore: () => Store<State>
  override: (
    newValue: AtomValue<State> | (() => AtomValue<State>)
  ) => Molecule<State, Exports>
  useExports: () => Exports
  useInvalidate: () => () => void
  useSelector: <D = any>(selector: (state: State) => D) => D
  useState: () => readonly [State, Store<State>['setState']]
  useStore: () => Store<State>
  value: AtomValue<State> | (() => AtomValue<State>)
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
  extends AtomBaseProperties {
  injectMutation: () => MutationAtomInstance<State, MutationParams>
  molecules?: Molecule<any, any> // TODO: type this first `any` (the second `any` is correct as-is)
  override: (
    newValue: () => (
      ...mutationParams: MutationParams
    ) => State | Promise<State>
  ) => MutationAtom<State, MutationParams>
  tts?: Scheduler
  ttl?: Scheduler
  useMutation: () => MutationAtomInstance<State, MutationParams>
  value: () => (...mutationParams: MutationParams) => State | Promise<State>
}

export interface MutationAtomInstance<State, MutationParams extends any[]>
  extends QueryAtomInstance<State, []> {
  mutate: (...mutationParams: MutationParams) => State | Promise<State>
  reset: () => void
}

export interface QueryAtom<State, Params extends any[]>
  extends AtomBaseProperties {
  injectInvalidate: (...params: Params) => () => void
  injectLazy: () => (...params: Params) => Store<State>
  injectQuery: (...params: Params) => QueryAtomInstance<State, Params>
  molecules?: Molecule<any, any> // TODO: type this first `any` (the second `any` is correct as-is)
  override: (
    newValue: (...params: Params) => () => State | Promise<State>
  ) => QueryAtom<State, Params>
  runOnWindowFocus?: boolean
  tts?: Scheduler
  ttl?: Scheduler
  useInvalidate: (...params: Params) => () => void
  useLazy: () => (...params: Params) => Store<State>
  useQuery: (...params: Params) => QueryAtomInstance<State, Params>
  value: (...params: Params) => () => State | Promise<State>
}

export interface QueryAtomInstance<State, Params extends any[]>
  extends AtomInstanceBaseProperties<Params> {
  cancel: () => void
  data?: State
  error?: Error
  invalidate: () => void
  isError: boolean
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  status: AsyncStatus
}

export interface ReadonlyAtomInstanceApi<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends AtomInstanceBaseProperties<Params> {
  injectExports: () => Exports
  injectInvalidate: () => () => void
  injectSelector: <D = any>(selector: (state: State) => D) => D
  injectValue: () => State
  params: Params
  useExports: () => Exports
  useInvalidate: () => () => void
  useSelector: <D = any>(selector: (state: State) => D) => D
  useValue: () => State
}

export interface ReadonlyLocalAtom<
  State,
  Params extends any[],
  Exports extends Record<string, any>,
  AtomInstanceApiType extends ReadonlyAtomInstanceApi<
    State,
    Params,
    Exports
  > = ReadonlyAtomInstanceApi<State, Params, Exports>
> {
  injectInstance: (...params: Params) => AtomInstanceApiType
  override: (
    newValue: AtomValue<State> | ((...params: Params) => AtomValue<State>)
  ) => ReadonlyLocalAtom<State, Params, Exports>
  useConsumer: () => AtomInstanceApiType
  useExports: () => Exports
  useInstance: (...params: Params) => AtomInstanceApiType
  useInvalidate: () => () => void
  useLazy: () => () => Store<State>
  useSelector: <D = any>(selector: (state: State) => D) => D
  useValue: () => State
}

// ReadonlyApp and ReadonlyGlobal atoms are "ReadonlyStandard" atoms
export interface ReadonlyStandardAtom<
  State,
  Params extends any[],
  Exports extends Record<string, any>,
  AtomInstanceApiType extends ReadonlyAtomInstanceApi<
    State,
    Params,
    Exports
  > = ReadonlyAtomInstanceApi<State, Params, Exports>
> extends StandardAtomBaseProperties<State, Params, Exports> {
  injectExports: (...params: Params) => Exports
  injectInstance: (...params: Params) => AtomInstanceApiType
  injectInvalidate: (...params: Params) => () => void
  injectLazy: () => (...params: Params) => Store<State>
  injectSelector: InjectOrUseSelector<State, Params>
  injectValue: (...params: Params) => State
  override: (
    newValue: AtomValue<State> | ((...params: Params) => AtomValue<State>)
  ) => ReadonlyStandardAtom<State, Params, Exports>
  ttl?: Scheduler
  useConsumer: () => AtomInstanceApiType
  useExports: (...params: Params) => Exports
  useInstance: (...params: Params) => AtomInstanceApiType
  useInvalidate: (...params: Params) => () => void
  useLazy: () => (...params: Params) => Store<State>
  useSelector: InjectOrUseSelector<State, Params>
  useValue: (...params: Params) => State
}

export enum Scope {
  App = 'App',
  Global = 'Global',
  Local = 'Local',
}

// App and Global atoms are "Standard" atoms
export interface StandardAtom<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends ReadonlyStandardAtom<
    State,
    Params,
    Exports,
    AtomInstanceApi<State, Params, Exports>
  > {
  injectDispatch: (...params: Params) => Dispatcher<State>
  injectSetState: (...params: Params) => StateSetter<State>
  injectState: (
    ...params: Params
  ) => readonly [State, Store<State>['setState'], Store<State>]
  injectStore: (...params: Params) => Store<State>
  useDispatch: (...params: Params) => Dispatcher<State>
  useSetState: (...params: Params) => StateSetter<State>
  useState: (...params: Params) => readonly [State, Store<State>['setState']]
  useStore: (...params: Params) => Store<State>
}

export interface StandardAtomBaseProperties<
  State,
  Params extends any[],
  Exports extends Record<string, any>,
  ScopeType extends Scope.Global | Scope.App = Scope.App,
  Readonly extends boolean = boolean,
  InstanceType extends AtomInstance<State, Params, Exports> = AtomInstance<
    State,
    Params,
    Exports
  >
> extends AtomBaseProperties {
  getReactContext: () => Context<InstanceType>
  molecules?: Molecule<any, any> // TODO: type this first `any` (the second `any` is correct as-is)
  readonly?: Readonly
  scope: ScopeType
  value: AtomValue<State> | ((...params: Params) => AtomValue<State>)
}

export enum StateType {
  Store,
  Value,
}

export type Scheduler = number // | Observable<any> | (store: Store<T>) => Observable<any> - not implementing observable ttl for now
