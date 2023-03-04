import { ActionChain, Observable, Settable, Store } from '@zedux/core'
import { AtomBase } from '../classes/atoms/AtomBase'
import { AtomApi } from '../classes/AtomApi'
import { Ecosystem } from '../classes/Ecosystem'
import { SelectorCacheItem } from '../classes/SelectorCache'
import { AtomInstanceType, AtomParamsType, AtomStateType } from './atoms'
import { AnyAtom, AnyAtomInstance } from './utils'

export * from './atoms'
export * from './utils'

export type ActiveState = 'Active' | 'Destroyed' | 'Initializing' | 'Stale'

export interface AtomGenerics {
  Exports: Record<string, any>
  Params: any[]
  Promise: AtomApiPromise
  State: any
  Store: Store<any>
}

export type AtomGenericsPartial<G extends Partial<AtomGenerics>> = Omit<
  AtomGenerics,
  keyof G
> &
  G

export type AtomApiPromise = Promise<any> | undefined

export interface AtomConfig<State = any> {
  dehydrate?: <D>(state: State) => D
  flags?: string[]
  hydrate?: <D>(dehydratedState: D) => State
  manualHydration?: boolean
  ttl?: number
}

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
  get<A extends ParamlessAtom>(atom: A): AtomStateType<A>

  get<A extends AnyAtom>(atom: A, params: AtomParamsType<A>): AtomStateType<A>

  get<AI extends AnyAtomInstance>(instance: AI): AtomStateType<AI>

  /**
   * Registers a static graph edge on the resolved atom instance when called
   * synchronously during atom or AtomSelector evaluation. When called
   * asynchronously, is just an alias for `ecosystem.getInstance`
   */
  getInstance<A extends ParamlessAtom>(atom: A): AtomInstanceType<A>

  getInstance<A extends AnyAtom>(
    atom: A,
    params: AtomParamsType<A>,
    edgeInfo?: GraphEdgeInfo
  ): AtomInstanceType<A>

  getInstance<AI extends AnyAtomInstance>(
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

export type AtomInstanceTtl = number | Promise<any> | Observable<any>

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

export type AtomStateFactory<G extends AtomGenerics> = (
  ...params: G['Params']
) =>
  | AtomApi<G['State'], G['Exports'], G['Store'] | undefined, G['Promise']>
  | G['Store']
  | G['State']

export type AtomTuple<A extends AnyAtom> = [A, AtomParamsType<A>]

export type AtomValueOrFactory<G extends AtomGenerics> =
  | AtomStateFactory<G>
  | G['Store']
  | G['State']

export type Cleanup = () => void

export type DependentCallback = (
  signal: GraphEdgeSignal,
  val?: any,
  reason?: EvaluationReason
) => any

export interface DependentEdge {
  callback?: DependentCallback
  createdAt: number
  flags: number // calculated from the EdgeFlags
  operation: string
  task?: () => void // for external edges - so they can unschedule jobs
}

export interface EcosystemConfig<
  Context extends Record<string, any> | undefined = any
> {
  complexParams?: boolean
  context?: Context
  defaultTtl?: number
  destroyOnUnmount?: boolean
  flags?: string[]
  id?: string
  onReady?: (
    ecosystem: Ecosystem<Context>,
    prevContext?: Context
  ) => MaybeCleanup
  overrides?: AnyAtom[]
  ssr?: boolean
}

export interface EcosystemGraphNode {
  dependencies: Record<string, true>
  dependents: Record<string, DependentEdge>
  isAtomSelector?: boolean
  weight: number
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

export type ExportsInfusedSetter<State, Exports> = Exports & {
  (settable: Settable<State>, meta?: any): State
}

export type GraphEdgeInfo = [
  // these flags are calculated from EdgeFlags:
  flags: number,
  operation: string
]

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

export interface InjectAtomInstanceConfig {
  operation?: string
  subscribe?: boolean
}

export type InjectorDeps = any[] | undefined

export type InjectOrUseSelector<State, Params extends any[]> = Params extends []
  ? <D = any>(selector: (state: State) => D) => D
  : <D = any>(params: Params, selector: (state: State) => D) => D

export interface InjectStoreConfig {
  hydrate?: boolean
  subscribe?: boolean
}

export type IonStateFactory<G extends AtomGenerics> = (
  getters: AtomGetters,
  ...params: G['Params']
) =>
  | AtomApi<G['State'], G['Exports'], G['Store'], G['Promise']>
  | G['Store']
  | G['State']

export type MaybeCleanup = Cleanup | void

export interface MutableRefObject<T = any> {
  current: T
}

export type ParamlessAtom = AtomBase<AtomGenericsPartial<{ Params: [] }>, any>

/**
 * Part of the atom instance can be accessed during initial evaluation. The only
 * fields that are inaccessible are those that don't exist yet 'cause the
 * initial evaluation is supposed to create them.
 */
export type PartialAtomInstance = Omit<
  AnyAtomInstance,
  'api' | 'exports' | 'promise' | 'store'
>

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
  | SelectorCacheItem<T, Args>

export type StateHookTuple<State, Exports> = [
  State,
  ExportsInfusedSetter<State, Exports>
]

export interface ZeduxHookConfig {
  operation?: string
  subscribe?: boolean
  suspend?: boolean
}
