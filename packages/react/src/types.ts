import { ActionChain, Observable, Settable, Store } from '@zedux/core'
import {
  AtomBase,
  AtomInstance,
  AtomInstanceBase,
  Ecosystem,
  StandardAtomBase,
} from './classes'
import { AtomApi } from './classes/AtomApi'
import { AtomSelectorCache } from './classes/SelectorCache'

export type ActiveState = 'Active' | 'Destroyed' | 'Initializing' | 'Stale'

export type AnyAtom = StandardAtomBase<any, any, any, any, any>
export type AnyAtomBase = AtomBase<any, any, AtomInstanceBase<any, any, any>>
export type AnyAtomInstance = AtomInstance<any, any, any, any, any>
export type AnyAtomInstanceBase = AtomInstanceBase<
  any,
  any,
  AtomBase<any, any, any>
>

export type AsyncEffectCallback<T = any> = (
  cleanup: (fn: Cleanup) => void
) => Promise<T> | void

export type AtomApiPromise = Promise<any> | undefined

export interface AtomConfig<State = any> {
  consumeHydrations?: boolean
  dehydrate?: <D>(state: State) => D
  flags?: string[]
  hydrate?: <D>(dehydratedState: D) => State
  manualHydration?: boolean
  maxInstances?: number
  ttl?: number
}

export type AtomExportsType<
  AtomType extends AnyAtom
> = AtomType extends StandardAtomBase<any, any, infer T, any, any> ? T : never

/**
 * The AtomGettersBase interface. You probably won't want to use this directly.
 * Use AtomGetters instead.
 */
export interface AtomGettersBase {
  /**
   * Registers a dynamic graph edge on the resolved atom instance when called
   * synchronously during atom or AtomSelector evaluation. When called
   * asynchronously, is just an alias for `ecosystem.get`
   */
  get<A extends AtomBase<any, [], any>>(atom: A): AtomStateType<A>

  get<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomStateType<A>

  get<AI extends AtomInstanceBase<any, [...any], any>>(
    instance: AI
  ): AtomInstanceStateType<AI>

  /**
   * Registers a static graph edge on the resolved atom instance when called
   * synchronously during atom or AtomSelector evaluation. When called
   * asynchronously, is just an alias for `ecosystem.getInstance`
   */
  getInstance<A extends AtomBase<any, [], any>>(atom: A): AtomInstanceType<A>

  getInstance<A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>,
    edgeInfo?: GraphEdgeInfo
  ): AtomInstanceType<A>

  getInstance<AI extends AtomInstanceBase<any, any, any>>(
    instance: AI,
    params?: [],
    edgeInfo?: GraphEdgeInfo
  ): AI

  /**
   * Runs an AtomSelector which receives its own AtomGetters object and can use
   * those to register its own dynamic and/or static graph edges (when called
   * synchronously during the AtomSelector's evaluation)
   *
   * ```ts
   * const mySelector = ion('mySelector', ({ select }) => {
   *   // registers a dynamic dependency on myAtom:
   *   const dynamicVal = select(({ get }) => get(myAtom))
   *
   *   injectEffect(() => {
   *     // doesn't register anything:
   *     const staticVal = select(({ get }) => get(myAtom))
   *   }, []) // no need to pass select as a dep; it's a stable reference
   * })
   * ```
   *
   * @see AtomSelector
   */
  select<T, Args extends any[]>(
    selectorOrConfigOrCache: Selectable<T, Args>,
    ...args: Args
  ): T
}

/**
 * AtomGetters are used all throughout Zedux. When called synchronously during
 * atom or AtomSelector evaluation, they register graph edges. When called
 * asynchronously, they're just aliases for the corresponding ecosystem method.
 *
 * ```ts
 * const mySelector = ion('mySelector', ({ ecosystem, get }) => {
 *   const dynamicVal = get(myAtom) // registers graph edge
 *   const staticVal = ecosystem.get(myAtom) // doesn't register anything
 *
 *   injectEffect(() => {
 *     const staticVal2 = get(myAtom) // doesn't register anything
 *     // const staticVal2 = ecosystem.get(myAtom) // same exact thing
 *   }, [])
 * })
 * ```
 */
export interface AtomGetters extends AtomGettersBase {
  /**
   * A reference to the ecosystem of the current atom instance or AtomSelector.
   *
   * The ecosystem itself has `get`, `getInstance`, and `select` methods which
   * can be used instead of the other AtomGetters to prevent graph dependencies
   * from being registered.
   *
   * ```ts
   * // the current component will NOT rerender when myAtom changes:
   * const staticVal = useAtomSelector(({ ecosystem }) => ecosystem.get(myAtom))
   *
   * // the current component will rerender when myAtom changes:
   * const dynamicVal = useAtomSelector(({ get }) => get(myAtom))
   * ```
   */
  ecosystem: Ecosystem
}

export type AtomInstanceAtomType<
  AtomInstanceType extends AtomInstanceBase<any, any, any>
> = AtomInstanceType extends AtomInstanceBase<any, any, infer T> ? T : never

export type AtomInstanceExportsType<
  AtomInstanceType extends AtomInstance<any, any, any, any, any>
> = AtomInstanceType extends AtomInstance<any, any, infer T, any, any>
  ? T
  : never

export type AtomInstanceParamsType<
  AtomInstanceType extends AtomInstanceBase<any, any, any>
> = AtomInstanceType extends AtomInstanceBase<any, infer T, any> ? T : never

export type AtomInstancePromiseType<
  AtomInstanceType extends AtomInstance<any, any, any, any, any>
> = AtomInstanceType extends AtomInstance<any, any, any, any, infer T>
  ? T
  : never

export type AtomInstanceStateType<
  AtomInstanceType extends AtomInstanceBase<any, any, any>
> = AtomInstanceType extends AtomInstanceBase<infer T, any, any> ? T : never

export type AtomInstanceStoreType<
  AtomInstanceType extends AtomInstance<any, any, any, any, any>
> = AtomInstanceType extends AtomInstance<any, any, any, infer T, any>
  ? T
  : never

export type AtomInstanceType<
  AtomType extends AtomBase<any, any, AtomInstanceBase<any, any, any>>
> = AtomType extends AtomBase<any, any, infer T> ? T : never

export type AtomInstanceTtl = number | Promise<any> | Observable<any>

export type AtomParamsType<
  AtomType extends AnyAtomBase
> = AtomType extends AtomBase<any, infer T, any> ? T : never

export type AtomPromiseType<
  AtomType extends AnyAtom
> = AtomType extends StandardAtomBase<any, any, any, any, infer T> ? T : never

export type AtomSelector<T = any, Args extends any[] = []> = (
  getters: AtomGetters,
  ...args: Args
) => T

export interface AtomSelectorConfig<T = any, Args extends any[] = []> {
  argsComparator?: (newArgs: Args, oldArgs: Args) => boolean
  name?: string
  resultsComparator?: (newResult: T, oldResult: T) => boolean
  selector: AtomSelector<T, Args>
}

export type AtomSelectorOrConfig<T = any, Args extends any[] = []> =
  | AtomSelector<T, Args>
  | AtomSelectorConfig<T, Args>

export interface AtomSetters<
  State,
  Params extends any[],
  Exports extends Record<string, any>,
  StoreType extends Store<State>,
  PromiseType extends AtomApiPromise
> extends AtomGetters {
  instance: AtomInstance<State, Params, Exports, StoreType, PromiseType>

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

export type AtomStateFactory<
  State = any,
  Params extends any[] = [],
  Exports extends Record<string, any> = Record<string, any>,
  StoreType extends Store<State> = Store<State>,
  PromiseType extends AtomApiPromise = undefined
> = (
  ...params: Params
) => AtomApi<State, Exports, StoreType, PromiseType> | StoreType | State

export type AtomStateType<
  AtomType extends AnyAtomBase
> = AtomType extends AtomBase<infer T, any, AtomInstanceBase<infer T, any, any>>
  ? T
  : never

export type AtomStoreType<
  AtomType extends AnyAtom
> = AtomType extends StandardAtomBase<any, any, any, infer T, any> ? T : never

export type AtomTuple<A extends AnyAtomBase> = [A, AtomParamsType<A>]

export type AtomValueOrFactory<
  State = any,
  Params extends any[] = [],
  Exports extends Record<string, any> = Record<string, any>,
  StoreType extends Store<State> = Store<State>,
  PromiseType extends AtomApiPromise = undefined
> =
  | AtomStateFactory<State, Params, Exports, StoreType, PromiseType>
  | StoreType
  | State

export type Cleanup = () => void

export interface DependentEdge {
  callback?: (
    signal: GraphEdgeSignal,
    val?: any,
    reason?: EvaluationReason
  ) => any
  createdAt: number
  flags: number // calculated from EdgeFlag enum
  operation: string
  task?: () => void // for external edges - so they can unschedule jobs
}

export type DispatchInterceptor<State = any> = (
  action: ActionChain,
  next: (action: ActionChain) => State
) => State

export interface EcosystemConfig<
  Context extends Record<string, any> | undefined = any
> {
  complexAtomParams?: boolean
  complexSelectorParams?: boolean
  consumeHydrations?: boolean
  context?: Context
  defaultTtl?: number
  destroyOnUnmount?: boolean
  flags?: string[]
  id?: string
  onReady?: (
    ecosystem: Ecosystem<Context>,
    prevContext?: Context
  ) => MaybeCleanup
  overrides?: AtomBase<any, any[], any>[]
  ssr?: boolean
}

/**
 * The flag score determines job priority in the scheduler. Scores range from
 * 0-7. Lower score = higher prio. Examples:
 *
 * 0 = implicit-internal-dynamic
 * 3 = explicit-external-dynamic
 * 7 = explicit-external-static
 */
export enum EdgeFlag {
  Explicit = 1,
  External = 2,
  Static = 4,
  // Deferred = 8,
}

export type EffectCallback = () => MaybeCleanup | Promise<any>

export interface EvaluationReason<State = any> {
  action?: ActionChain
  newState?: State
  oldState?: State
  operation: string // e.g. a method like "injectValue"
  sourceType: EvaluationSourceType
  sourceKey?: string // e.g. an atom like "myAtom"
  reasons?: EvaluationReason[]
  type: EvaluationType
}

export type EvaluationSourceType =
  | 'Atom'
  | 'AtomSelector'
  | 'External'
  | 'Injector'
  | 'Store'

export type EvaluationType =
  | 'cache invalidated'
  | 'node destroyed'
  | 'promise changed'
  | 'state changed'

export type GraphEdgeInfo = [flags: number, operation: string] // flags are from EdgeFlag enum

/**
 * A low-level detail that tells dependents what sort of event is causing the
 * current update. Promise changes and state updates are lumped together as
 * 'Update' signals. If you need to distinguish between them, look at the
 * EvaluationType (the `type` field) in the full reasons list.
 */
export type GraphEdgeSignal = 'Destroyed' | 'Updated'

export interface GraphViewRecursive {
  [key: string]: GraphViewRecursive
}

export type InjectorDeps = any[] | undefined

export type InjectOrUseSelector<State, Params extends any[]> = Params extends []
  ? <D = any>(selector: (state: State) => D) => D
  : <D = any>(params: Params, selector: (state: State) => D) => D

export interface InjectStoreConfig {
  hydrate?: boolean
  subscribe?: boolean
}

export type IonGet<
  State,
  Params extends any[],
  Exports extends Record<string, any>,
  StoreType extends Store<State>,
  PromiseType extends AtomApiPromise
> = (
  getters: AtomGetters,
  ...params: Params
) => AtomApi<State, Exports, StoreType, PromiseType> | StoreType | State

export type IonSet<
  State,
  Params extends any[],
  Exports extends Record<string, any>,
  StoreType extends Store<State>,
  PromiseType extends AtomApiPromise
> = (
  setters: AtomSetters<State, Params, Exports, StoreType, PromiseType>,
  settable: Settable<State>
) => State | void

export type MaybeCleanup = Cleanup | void

export interface MutableRefObject<T = any> {
  current: T
}

export interface PromiseState<T> {
  data?: T
  error?: Error
  isError: boolean
  isLoading: boolean
  isSuccess: boolean
  status: PromiseStatus
}

export type PromiseStatus = 'error' | 'loading' | 'success'

export type Ref<T = any> = MutableRefObject<T>

export interface RefObject<T = any> {
  readonly current: T | null
}

export type Selectable<T = any, Args extends any[] = []> =
  | AtomSelector<T, Args>
  | AtomSelectorConfig<T, Args>
  | AtomSelectorCache<T, Args>

export type SetStateInterceptor<State = any> = (
  settable: Settable<State>,
  next: (settable: Settable<State>) => State
) => State

export type StateHookTuple<S, E> = [
  S,
  E & {
    (settable: Settable<S>, meta?: any): S
  }
]

export interface ZeduxHookConfig {
  operation?: string
  suspend?: boolean
}
