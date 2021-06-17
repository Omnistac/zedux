import { ActionChain, Settable, Store } from '@zedux/core'
import { Observable } from 'rxjs'
import { Atom, AtomInstance, Ecosystem } from './classes'
import { AtomApi } from './classes/AtomApi'
import { injectGetInstance } from './injectors'

export enum ActiveState {
  Active = 'Active',
  Destroyed = 'Destroyed',
  Stale = 'Stale',
  Initializing = 'Initializing',
}

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
  AtomType extends Atom<any, any, any>
> = AtomType extends Atom<any, any, infer T> ? T : never

export type AtomInstanceAtomType<
  AtomInstanceType extends AtomInstance<any, any, any, any>
> = AtomInstanceType extends AtomInstance<any, any, any, infer T> ? T : never

export type AtomInstanceExportsType<
  AtomInstanceType extends AtomInstance<any, any, any, any>
> = AtomInstanceType extends AtomInstance<any, any, infer T, any> ? T : never

export type AtomInstanceParamsType<
  AtomInstanceType extends AtomInstance<any, any, any, any>
> = AtomInstanceType extends AtomInstance<any, infer T, any, any> ? T : never

export type AtomInstanceStateType<
  AtomInstanceType extends AtomInstance<any, any, any, any>
> = AtomInstanceType extends AtomInstance<infer T, any, any, any> ? T : never

export type AtomInstanceType<A extends Atom<any, any, any>> = AtomInstance<
  AtomStateType<A>,
  AtomParamsType<A>,
  AtomExportsType<A>,
  A
>

export type AtomInstanceTtl = number | Promise<any> | Observable<any>

export type AtomParamsType<
  AtomType extends Atom<any, any, any>
> = AtomType extends Atom<any, infer T, any> ? T : never

export type AtomStateType<
  AtomType extends Atom<any, any, any>
> = AtomType extends Atom<infer T, any, any> ? T : never

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
  flags?: string[]
  id?: string
  overrides?: Atom<any, any[], any>[]
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
  utils: IonGetUtils,
  ...params: Params
) => AtomValue<State> | AtomApi<State, Exports>

export interface IonGetUtils {
  ecosystem: Ecosystem
  get: typeof AtomInstance.prototype['_get']
  getInstance: ReturnType<typeof injectGetInstance>
}

export type IonSet<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> = (
  utils: IonSetUtils<State, Params, Exports>,
  settable: Settable<State>
) => State | void

export interface IonSetUtils<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> {
  ecosystem: Ecosystem
  get: IonGetUtils['get']
  getInstance: ReturnType<typeof injectGetInstance>
  instance: AtomInstance<State, Params, Exports, Atom<State, Params, Exports>>

  set<A extends Atom<any, [], any>>(
    atom: A,
    settable: Settable<AtomStateType<A>>
  ): AtomStateType<A>

  set<A extends Atom<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>,
    settable: Settable<AtomStateType<A>>
  ): AtomStateType<A>
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
