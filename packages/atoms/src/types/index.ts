import { ActionChain, Observable, Settable } from '@zedux/core'
import { AtomApi } from '../classes/AtomApi'
import { Ecosystem } from '../classes/Ecosystem'
import {
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomGenerics,
  AtomGenericsToAtomApiGenerics,
  AtomInstanceType,
  AtomParamsType,
  AtomStateType,
} from './atoms'
import { SelectorInstance } from '../classes/SelectorInstance'
import { GraphNode } from '../classes/GraphNode'
import { InternalEvaluationType } from '../utils/general'

export * from './atoms'

// eslint-disable-next-line @typescript-eslint/ban-types
export type AnyNonNullishValue = {}

export interface AtomConfig<State = any> {
  dehydrate?: (state: State) => any
  flags?: string[]
  hydrate?: (dehydratedState: unknown) => State
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
  get<A extends AnyAtomTemplate>(
    template: A,
    params: AtomParamsType<A>
  ): AtomStateType<A>

  get<A extends AnyAtomTemplate<{ Params: [] }>>(template: A): AtomStateType<A>

  get<A extends AnyAtomTemplate>(
    template: ParamlessTemplate<A>
  ): AtomStateType<A>

  get<I extends AnyAtomInstance>(instance: I): AtomStateType<I>

  /**
   * Registers a static graph edge on the resolved atom instance when called
   * synchronously during atom or AtomSelector evaluation. When called
   * asynchronously, is just an alias for `ecosystem.getInstance`
   */
  getInstance<A extends AnyAtomTemplate>(
    template: A,
    params: AtomParamsType<A>,
    edgeInfo?: GraphEdgeDetails
  ): AtomInstanceType<A>

  getInstance<A extends AnyAtomTemplate<{ Params: [] }>>(
    template: A
  ): AtomInstanceType<A>

  getInstance<A extends AnyAtomTemplate>(
    template: ParamlessTemplate<A>
  ): AtomInstanceType<A>

  getInstance<I extends AnyAtomInstance>(
    instance: I,
    params?: [],
    edgeInfo?: GraphEdgeDetails
  ): I

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
  select<S extends Selectable>(
    selectorOrConfigOrInstance: S,
    ...args: AtomParamsType<S>
  ): AtomStateType<S>
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

export type AtomSelector<State = any, Params extends any[] = any> = (
  getters: AtomGetters,
  ...args: Params
) => State

export interface AtomSelectorConfig<State = any, Params extends any[] = any> {
  argsComparator?: (newArgs: Params, oldArgs: Params) => boolean
  name?: string
  resultsComparator?: (newResult: State, oldResult: State) => boolean
  selector: AtomSelector<State, Params>
}

// TODO: rename to SelectorTemplate
export type AtomSelectorOrConfig<State = any, Params extends any[] = any> =
  | AtomSelector<State, Params>
  | AtomSelectorConfig<State, Params>

export type AtomStateFactory<
  G extends Pick<
    AtomGenerics,
    'Exports' | 'Params' | 'Promise' | 'State' | 'Store'
  >
> = (
  ...params: G['Params']
) => AtomApi<AtomGenericsToAtomApiGenerics<G>> | G['Store'] | G['State']

export type AtomTuple<A extends AnyAtomTemplate> = [A, AtomParamsType<A>]

export type AtomValueOrFactory<
  G extends Pick<
    AtomGenerics,
    'Exports' | 'Params' | 'Promise' | 'State' | 'Store'
  >
> = AtomStateFactory<G> | G['Store'] | G['State']

export type Cleanup = () => void

export interface DehydrationOptions extends NodeFilterOptions {
  transform?: boolean
}

export type DehydrationFilter = string | AnyAtomTemplate | DehydrationOptions

export type DependentCallback = (
  signal: GraphEdgeSignal,
  val?: any,
  reason?: InternalEvaluationReason
) => any

export interface EcosystemConfig<
  Context extends Record<string, any> | undefined = any
> {
  atomDefaults?: {
    ttl?: number
  }
  complexParams?: boolean
  context?: Context
  destroyOnUnmount?: boolean
  flags?: string[]
  id?: string
  onReady?: (
    ecosystem: Ecosystem<Context>,
    prevContext?: Context
  ) => MaybeCleanup
  overrides?: AnyAtomTemplate[]
  ssr?: boolean
}

export type EffectCallback = () => MaybeCleanup | Promise<any>

export interface EvaluationReason<State = any> {
  action?: ActionChain
  newState?: State
  oldState?: State
  operation?: string // e.g. a method like "injectValue"
  source?: GraphNode
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

export type GraphEdgeDetails = {
  /**
   * `f`lags - the binary EdgeFlags of this edge
   */
  f: number

  /**
   * `op`eration - an optional user-friendly string describing the operation
   * that created this edge
   */
  op?: string
}

// TODO: optimize this internal object to use single-letter properties
export interface GraphEdge {
  createdAt: number
  flags: number // calculated from the EdgeFlags
  operation: string

  /**
   * `p`endingFlags - an internal marker used by the graph algorithm - tracks
   * what the flags will be for this edge after the current evaluation (or
   * undefined if it should be removed)
   */
  p?: number
}

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

export interface InjectPromiseConfig<T = any> {
  dataOnly?: boolean
  initialState?: T
  runOnInvalidate?: boolean
}

export interface InjectStoreConfig {
  hydrate?: boolean
  subscribe?: boolean
}

export interface InternalEvaluationReason<State = any> {
  /**
   * `p`revState - the old state of the source node
   */
  p?: State

  /**
   * `s`ource - the node that caused its observer to update
   */
  s?: GraphNode

  /**
   * `r`easons - an indefinitely nested list of reasons that caused the `s`ource
   * to update in the first place
   */
  r?: InternalEvaluationReason[]

  /**
   * `t`ype - an obfuscated number representing the type of update (e.g. whether
   * the source node was force destroyed or its promise updated). Zedux's `why`
   * utils translate this into a user-friendly string.
   */
  t?: InternalEvaluationType
}

export type IonStateFactory<G extends Omit<AtomGenerics, 'Node' | 'Template'>> =
  (
    getters: AtomGetters,
    ...params: G['Params']
  ) => AtomApi<AtomGenericsToAtomApiGenerics<G>> | G['Store'] | G['State']

export type LifecycleStatus = 'Active' | 'Destroyed' | 'Initializing' | 'Stale'

export type MaybeCleanup = Cleanup | void

export interface MutableRefObject<T = any> {
  current: T
}

export interface NodeFilterOptions {
  exclude?: (AnyAtomTemplate | AtomSelectorOrConfig | string)[]
  excludeFlags?: string[]
  include?: (AnyAtomTemplate | AtomSelectorOrConfig | string)[]
  includeFlags?: string[]
}

export type NodeFilter =
  | string
  | AnyAtomTemplate
  | AtomSelectorOrConfig
  | NodeFilterOptions

/**
 * Many Zedux APIs make the `params` parameter optional if the atom doesn't take
 * params or has only optional params.
 */
export type ParamlessTemplate<
  A extends
    | AnyAtomTemplate
    | AnyAtomInstance
    | AtomSelectorOrConfig
    | SelectorInstance
> = AtomParamsType<A> extends [AnyNonNullishValue | undefined | null, ...any[]]
  ? never
  : A

/**
 * Part of the atom instance can be accessed during initial evaluation. The only
 * fields that are inaccessible are those that don't exist yet 'cause the
 * initial evaluation is supposed to create them.
 */
export type PartialAtomInstance = Omit<
  AnyAtomInstance,
  'api' | 'exports' | 'promise' | 'store'
>

// from Matt Pocock https://twitter.com/mattpocockuk/status/1622730173446557697
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & AnyNonNullishValue

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

export type Selectable<State = any, Params extends any[] = any[]> =
  | AtomSelectorOrConfig<State, Params>
  | SelectorInstance<{
      Params: Params
      State: State
      Template: AtomSelectorOrConfig<State, Params>
    }>

export type StateHookTuple<State, Exports> = [
  State,
  ExportsInfusedSetter<State, Exports>
]
