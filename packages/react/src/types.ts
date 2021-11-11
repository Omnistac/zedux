import { ActionChain, Settable, Store } from '@zedux/core'
import { Observable } from 'rxjs'
import {
  AtomBase,
  AtomInstance,
  AtomInstanceBase,
  Ecosystem,
  StandardAtomBase,
} from './classes'
import { AtomApi } from './classes/AtomApi'

export enum ActiveState {
  Active = 'Active',
  Destroyed = 'Destroyed',
  Stale = 'Stale',
  Initializing = 'Initializing',
}

export type AnyAtom = StandardAtomBase<any, any, any>
export type AnyAtomBase = AtomBase<any, any, any>
export type AnyAtomInstance = AtomInstance<any, any, any>
export type AnyAtomInstanceBase = AtomInstanceBase<any, any, any>

export type AsyncEffectCallback<T = any> = (
  cleanup: (destructor: Destructor) => void
) => Promise<T> | void

export interface AsyncState<T> {
  data?: T
  error?: Error
  isError: boolean
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  prevStatus?: AsyncStatus
  status: AsyncStatus
}

export enum AsyncStatus {
  Error = 'Error',
  Idle = 'Idle',
  Loading = 'Loading',
  Success = 'Success',
}

export type AsyncStore<T> = Store<AsyncState<T>>

export interface AtomConfig {
  flags?: string[]
  forwardPromises?: boolean
  maxInstances?: number
  // molecules?: Molecule<any, any>[] // TODO: type this first `any` (the second `any` is correct as-is)
  // readonly?: boolean
  ttl?: number
}

export type AtomExportsType<
  AtomType extends AnyAtom
> = AtomType extends StandardAtomBase<any, any, infer T> ? T : never

export interface AtomGetters {
  ecosystem: Ecosystem
  get: Ecosystem['get']
  getInstance: Ecosystem['getInstance']
  select: Ecosystem['select']
}

export type AtomInstanceAtomType<
  AtomInstanceType extends AtomInstanceBase<any, any, any>
> = AtomInstanceType extends AtomInstanceBase<any, any, infer T> ? T : never

export type AtomInstanceExportsType<
  AtomInstanceType extends AtomInstance<any, any, any>
> = AtomInstanceType extends AtomInstance<any, any, infer T> ? T : never

export type AtomInstanceParamsType<
  AtomInstanceType extends AtomInstanceBase<any, any, any>
> = AtomInstanceType extends AtomInstanceBase<any, infer T, any> ? T : never

export type AtomInstanceStateType<
  AtomInstanceType extends AtomInstanceBase<any, any, any>
> = AtomInstanceType extends AtomInstanceBase<infer T, any, any> ? T : never

export type AtomInstanceType<
  AtomType extends AtomBase<any, any, AtomInstanceBase<any, any, any>>
> = AtomType extends AtomBase<any, any, infer T> ? T : never

export type AtomInstanceTtl = number | Promise<any> | Observable<any>

export type AtomParamsType<
  AtomType extends AnyAtomBase
> = AtomType extends AtomBase<any, infer T, any> ? T : never

export type AtomSelector<T = any, Args extends any[] = []> = (
  getters: AtomGetters,
  ...args: Args
) => T

export interface AtomSelectorConfig<T = any, Args extends any[] = []> {
  argsAreEqual?: (newArgs: Args, oldArgs: Args) => boolean
  resultsAreEqual?: (newResult: T, oldResult: T) => boolean
  selector: AtomSelector<T, Args>
}

export type AtomSelectorOrConfig<T = any, Args extends any[] = []> =
  | AtomSelector<T, Args>
  | AtomSelectorConfig<T, Args>

export interface AtomSetters<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> {
  ecosystem: Ecosystem
  get: Ecosystem['get']
  getInstance: Ecosystem['getInstance']
  instance: AtomInstance<State, Params, Exports>

  set<A extends AtomBase<any, [], any>>(
    atom: A,
    settable: Settable<AtomStateType<A>>
  ): AtomStateType<A>

  set<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>,
    settable: Settable<AtomStateType<A>>
  ): AtomStateType<A>
}

export type AtomStateType<
  AtomType extends AnyAtomBase
> = AtomType extends AtomBase<infer T, any, AtomInstanceBase<infer T, any, any>>
  ? T
  : never

export type AtomTuple<A extends AnyAtomBase> = [
  A,
  ...(A extends AtomBase<any, [], any> ? [] : [AtomParamsType<A>])
]

export type AtomValue<State = any> = State | Store<State>

export type AtomValueOrFactory<
  State = any,
  Params extends any[] = [],
  Exports extends Record<string, any> = Record<string, any>
> =
  | AtomValue<State>
  | AtomApi<State, Exports>
  | ((...params: Params) => AtomValue<State> | AtomApi<State, Exports>)

export type Destructor = () => void

export type DispatchInterceptor<State = any> = (
  action: ActionChain,
  next: (action: ActionChain) => State
) => State

export interface EcosystemConfig<
  Context extends Record<string, any> | undefined = any
> {
  context?: Context
  defaultForwardPromises?: boolean
  defaultTtl?: number
  destroyOnUnmount?: boolean
  ghostTtlMs?: number
  flags?: string[]
  id?: string
  overrides?: AtomBase<any, any[], any>[]
  preload?: (ecosystem: Ecosystem, context: Context) => void
}

export type EffectCallback = () => void | Destructor

export type InjectOrUseSelector<State, Params extends any[]> = Params extends []
  ? <D = any>(selector: (state: State) => D) => D
  : <D = any>(params: Params, selector: (state: State) => D) => D

export type IonGet<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> = (
  getters: AtomGetters,
  ...params: Params
) => AtomValue<State> | AtomApi<State, Exports>

export type IonSet<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> = (
  setters: AtomSetters<State, Params, Exports>,
  settable: Settable<State>
) => State | void

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
// export interface Molecule<State, Exports extends Record<string, any>>
//   extends AtomBaseProperties<State, []> {
//   injectExports: () => Exports
//   injectState: () => readonly [State, Store<State>['setState'], Store<State>]
//   injectStore: () => Store<State>
//   override: (newValue: () => AtomValue<State>) => Molecule<State, Exports>
//   useExports: () => Exports
//   useState: () => readonly [State, Store<State>['setState']]
//   useStore: () => Store<State>
//   value: () => AtomValue<State>
// }

// export interface MoleculeInstance<State, Exports extends Record<string, any>>
//   extends AtomInstanceBase<State, []> {
//   exports: Exports
// }

// export interface Mutation<State, MutationParams extends any[]>
//   extends Query<State, [], MutationAtomInstance<State, MutationParams>> {
//   mutate: MutationAtomInstance<State, MutationParams>['mutate']
// }

/**
 * MutationAtom
 *
 * Every time `.injectMutation()` or `.useMutation()` is used, a new instance is created.
 * There is therefore no need for useInvalidate or useCancel hooks (or injectors).
 * Use `mutation.invalidate()` or `mutation.cancel()`.
 *
 * TODO: Provide useInvalidateAll() and useCancelAll() hooks/injectors.
 */
// export interface MutationAtom<State, MutationParams extends any[]>
//   extends AtomBaseProperties<State, []> {
//   getReactContext: () => Context<MutationAtomInstance<State, MutationParams>>
//   injectMutation: () => Mutation<State, MutationParams>
//   molecules?: Molecule<any, any> // TODO: type this first `any` (the second `any` is correct as-is)
//   override: (
//     newValue: () => (
//       ...mutationParams: MutationParams
//     ) => State | Promise<State>
//   ) => MutationAtom<State, MutationParams>
//   tts?: Scheduler
//   ttl?: Scheduler
//   useMutation: () => Mutation<State, MutationParams>
//   value: () => (...mutationParams: MutationParams) => State | Promise<State>
// }

// export interface MutationAtomInstance<State, MutationParams extends any[]>
//   extends Omit<QueryAtomInstance<State, []>, 'run'> {
//   mutate: (...mutationParams: MutationParams) => State | Promise<State>
//   reset: () => void
// }

// export interface Query<
//   State,
//   Params extends any[],
//   InstanceType extends Omit<
//     QueryAtomInstance<State, Params>,
//     'run'
//   > = QueryAtomInstance<State, Params>
// > {
//   data?: State
//   error?: Error
//   instance: InstanceType
//   isError: boolean
//   isIdle: boolean
//   isLoading: boolean
//   isSuccess: boolean
//   status: AsyncStatus
// }

// export interface QueryAtom<
//   State,
//   Params extends any[],
//   InstanceType extends AtomInstanceBase<
//     AsyncState<State>,
//     Params
//   > = QueryAtomInstance<State, Params>
// > extends AtomBaseProperties<AsyncState<State>, Params, InstanceType> {
//   getReactContext: () => Context<InstanceType>
//   injectInstance: (...params: Params) => InstanceType
//   injectLazy: () => (...params: Params) => InstanceType
//   injectQuery: (...params: Params) => Query<State, Params>
//   injectSelector: InjectOrUseSelector<State, Params>
//   molecules?: Molecule<any, any> // TODO: type this first `any` (the second `any` is correct as-is)
//   override: (
//     newValue: (...params: Params) => () => State | Promise<State>
//   ) => QueryAtom<State, Params>
//   runOnWindowFocus?: boolean
//   tts?: Scheduler
//   ttl?: Scheduler
//   useConsumer: () => InstanceType
//   useInstance: (...params: Params) => InstanceType
//   useLazy: () => (...params: Params) => InstanceType
//   useQuery: (...params: Params) => Query<State, Params>
//   useSelector: InjectOrUseSelector<State, Params>
//   value: (...params: Params) => () => State | Promise<State>
// }

// export interface QueryAtomInstance<State, Params extends any[]>
//   extends AtomInstanceBase<AsyncState<State>, Params> {
//   cancel: () => void
//   invalidate: () => void
//   Provider: React.ComponentType
//   run: () => State | Promise<State>
//   store: AsyncStore<State>
// }

export interface MutableRefObject<T = any> {
  current: T
}

export enum PromiseStatus {
  Pending,
  Resolved,
  Rejected,
}

export type Ref<T = any> = MutableRefObject<T>

export interface RefObject<T = any> {
  readonly current: T | null
}

export type Scheduler = number // | Observable<any> | (store: Store<T>) => Observable<any> - not implementing observable ttl for now

export type SetStateInterceptor<State = any> = (
  settable: Settable<State>,
  next: (settable: Settable<State>) => State
) => State

export enum StateType {
  Store,
  Value,
}
