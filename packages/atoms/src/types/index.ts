import { AtomTemplateBase } from '../classes/templates/AtomTemplateBase'
import { AtomApi } from '../classes/AtomApi'
import { Ecosystem } from '../classes/Ecosystem'
import { ZeduxNode } from '../classes/ZeduxNode'
import { SelectorInstance } from '../classes/SelectorInstance'
import { Signal } from '../classes/Signal'
import {
  InternalEvaluationType,
  InternalLifecycleStatus,
} from '../utils/general'
import {
  AnyAtomGenerics,
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomGenerics,
  AtomGenericsToAtomApiGenerics,
  ParamsOf,
  StateOf,
} from './atoms'
import { ExplicitEvents, ImplicitEvents } from './events'

export * from './atoms'
export * from './events'

// eslint-disable-next-line @typescript-eslint/ban-types
export type AnyNonNullishValue = {}

export interface AtomConfig<State = any> {
  dehydrate?: (state: State) => any
  tags?: string[]
  hydrate?: (dehydratedState: unknown) => State
  ttl?: number
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
 *
 * @deprecated "atom getters" are now functions on the Ecosystem. Use the
 * `Ecosystem` class instead
 *
 * ```ts
 * mySelector = ({ get }: AtomGetters) => get(myAtom) // before
 * mySelector = ({ get }: Ecosystem) => get(myAtom) // after
 * ```
 */
export type AtomGetters = Ecosystem

export type AtomInstanceTtl = number | Promise<any> | Observable<any>

export type AtomSelector<State = any, Params extends any[] = any> = (
  ecosystem: Ecosystem,
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
  G extends Pick<AtomGenerics, 'Exports' | 'Params' | 'Promise' | 'State'> & {
    Signal: Signal | undefined
  }
> = (
  ...params: G['Params']
) =>
  | AtomApi<Pick<G, 'Exports' | 'Promise' | 'State'> & { Signal: G['Signal'] }>
  | G['Signal']
  | G['State']

export type AtomTuple<A extends AnyAtomTemplate> = [A, ParamsOf<A>]

export type AtomValueOrFactory<
  G extends Pick<AtomGenerics, 'Exports' | 'Params' | 'Promise' | 'State'> & {
    Signal: Signal | undefined
  }
> = AtomStateFactory<G> | G['State']

export type Cleanup = () => void

export interface DehydrationOptions extends NodeFilterOptions {
  transform?: boolean
}

export type DehydrationFilter =
  | string
  | NodeType
  | AnyAtomTemplate
  | DehydrationOptions

export interface EcosystemConfig<
  Context extends Record<string, any> | undefined = any
> {
  atomDefaults?: {
    ttl?: number
  }
  complexParams?: boolean
  context?: Context
  makeId?: (
    this: Ecosystem,
    nodeType:
      | 'atom'
      | 'component'
      | 'listener'
      | 'memo'
      | 'ref'
      | 'selector'
      | 'signal',
    context?: ZeduxNode | string,
    suffix?: number | string
  ) => string
  tags?: string[]
  id?: string
  onReady?: (
    ecosystem: Ecosystem<Context>,
    prevContext?: Context
  ) => MaybeCleanup
  overrides?: AnyAtomTemplate[]
  ssr?: boolean
}

export type EffectCallback = () => MaybeCleanup | Promise<any>

/**
 * A user-defined object mapping custom event names to unused placeholder
 * functions whose return types are used to infer expected event payloads.
 *
 * We map all Zedux built-in events to `never` here to prevent users from
 * specifying those events
 */
export type EventMap = {
  [K in keyof ExplicitEvents & ImplicitEvents]?: never
} & Record<string, () => any>

export interface ExportsConfig {
  wrap?: boolean
}

export type ExportsInfusedSetter<State, Exports> = Exports & {
  (settable: Settable<State>, meta?: any): State
}

export interface GetNode {
  // TODO: Dedupe these overloads
  // atoms
  <G extends AtomGenerics = AnyAtomGenerics>(
    templateOrNode: AtomTemplateBase<G> | ZeduxNode<G>,
    params: G['Params'],
    edgeConfig?: GraphEdgeConfig
  ): G['Node']

  <G extends AnyAtomGenerics<{ Params: [] }> = AnyAtomGenerics<{ Params: [] }>>(
    templateOrNode: AtomTemplateBase<G> | ZeduxNode<G>
  ): G['Node']

  <G extends AtomGenerics = AnyAtomGenerics>(
    templateOrInstance: ParamlessTemplate<AtomTemplateBase<G> | ZeduxNode<G>>
  ): G['Node']

  // selectors
  <S extends Selectable>(
    template: S,
    params: ParamsOf<S>,
    edgeConfig?: GraphEdgeConfig
  ): S extends AtomSelectorOrConfig
    ? SelectorInstance<{
        Params: ParamsOf<S>
        State: StateOf<S>
        Template: S
      }>
    : S

  <S extends Selectable<any, []>>(template: S): S extends AtomSelectorOrConfig
    ? SelectorInstance<{
        Params: ParamsOf<S>
        State: StateOf<S>
        Template: S
      }>
    : S

  <S extends Selectable>(
    template: ParamlessTemplate<S>
  ): S extends AtomSelectorOrConfig
    ? SelectorInstance<{
        Params: ParamsOf<S>
        State: StateOf<S>
        Template: S
      }>
    : S

  <N extends ZeduxNode>(node: N, params?: [], edgeConfig?: GraphEdgeConfig): N

  // catch-all
  <G extends AtomGenerics>(
    template: AtomTemplateBase<G> | ZeduxNode<G> | AtomSelectorOrConfig<G>,
    params: G['Params'],
    edgeConfig?: GraphEdgeConfig
  ): G['Node']
}

export interface GraphEdgeConfig {
  /**
   * `f`lags - the binary EdgeFlags of this edge
   */
  f?: number

  /**
   * `op`eration - an optional user-friendly string describing the operation
   * that created this edge
   */
  op?: string
}

// TODO: optimize this internal object to use single-letter properties
export interface GraphEdge {
  flags: number // calculated from the EdgeFlags
  operation: string

  /**
   * `p`endingFlags - an internal marker used by the graph algorithm - tracks
   * what the flags will be for this edge after the current evaluation (or
   * undefined if it should be removed)
   */
  p?: number
}

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

export interface InjectSignalConfig<MappedEvents extends EventMap> {
  events?: MappedEvents
  reactive?: boolean
}

export interface InjectStoreConfig {
  hydrate?: boolean
  subscribe?: boolean
}

export interface InternalEvaluationReason<State = any> {
  /**
   * `e`ventMap - any events sent along with the update that should notify this
   * node's listeners and/or trigger special functionality in Zedux. These are
   * always either custom events or ExplicitEvents, never ImplicitEvents
   */
  e?: Record<string, any>

  /**
   * `f`ullEventMap - when an evaluation reason reaches an event observer, that
   * observer creates the full map of ImplicitEvents that the reason should
   * trigger. These ImplicitEvents are merged into the existing `e`ventMap of
   * custom events and ExplicitEvents.
   *
   * This is what ultimately gets passed to `ZeduxNode#on` event listeners.
   */
  f?: Record<string, any>

  /**
   * `l`inkedReason - Evaluation reasons use a singly-linked list rather than an
   * array for better performance/memory usage. This references the next reason
   * in the chain.
   */
  l?: InternalEvaluationReason

  /**
   * `n`ewStateOrStatus - depending on `t`ype, this is either the new state or
   * new lifecycle status of the `s`ource node.
   */
  n?: InternalLifecycleStatus | State

  /**
   * `o`ldStateOrStatus - depending on `t`ype, this is either the previous state
   * or previous lifecycle status of the `s`ource node.
   */
  o?: InternalLifecycleStatus | State

  /**
   * `s`ource - the node that caused its observer to update
   */
  s?: ZeduxNode

  /**
   * `r`easons - indefinitely nested singly-linked lists of reasons that caused
   * the `s`ource to update in the first place
   */
  r?: InternalEvaluationReason

  /**
   * `t`ype - an obfuscated number representing the type of update (e.g. whether
   * the source node was force destroyed or its promise updated). Zedux's `why`
   * utils translate this into a user-friendly string.
   *
   * If not specified, it's assumed to be a "normal" update (usually a state
   * change).
   */
  t?: InternalEvaluationType
}

export type IonStateFactory<G extends Omit<AtomGenerics, 'Node' | 'Template'>> =
  (
    ecosystem: Ecosystem,
    ...params: G['Params']
  ) => AtomApi<AtomGenericsToAtomApiGenerics<G>> | Signal<G> | G['State']

export interface Job {
  /**
   * `W`eight - the weight of the node (for EvaluateZeduxNode jobs).
   */
  W?: number

  /**
   * `j`ob - the actual task to run.
   */
  j: () => void

  /**
   * `T`ype - the job type. Different types get different priorities in the
   * scheduler.
   *
   * 1 - Interrupt
   * 2 - EvaluateZeduxNode
   * 3 - UpdateExternalDependent
   * 4 - RunEffect
   */
  T: 1 | 2 | 3 | 4
}

export type LifecycleStatus = 'Active' | 'Destroyed' | 'Initializing' | 'Stale'

export interface ListenerConfig {
  active?: boolean
}

export type MapEvents<T extends EventMap> = Prettify<{
  [K in keyof T]: ReturnType<T[K]>
}>

export type MaybeCleanup = Cleanup | void

export interface MutableRefObject<T = any> {
  current: T
}

export interface Observable<T = any> {
  subscribe(subscriber: (value: T) => any): { unsubscribe: () => void }
}

export interface NodeFilterOptions {
  exclude?: (AnyAtomTemplate | AtomSelectorOrConfig | NodeType | string)[]
  excludeTags?: string[]
  include?: (AnyAtomTemplate | AtomSelectorOrConfig | NodeType | string)[]
  includeTags?: string[]
}

export type NodeFilter =
  | string
  | NodeType
  | AnyAtomTemplate
  | AtomSelectorOrConfig
  | NodeFilterOptions

export type NodeType =
  | '@atom'
  | '@component'
  | '@listener'
  | '@memo'
  | '@selector'
  | '@signal'

/**
 * Reads better than `Record<never, never>` in atom generics
 */
export type None = Prettify<Record<never, never>>

/**
 * Many Zedux APIs make the `params` parameter optional if the atom doesn't take
 * params or has only optional params.
 */
export type ParamlessTemplate<
  A extends AnyAtomTemplate | AtomSelectorOrConfig | ZeduxNode
> = ParamsOf<A> extends [AnyNonNullishValue | undefined | null, ...any[]]
  ? never
  : A

/**
 * Part of the atom instance can be accessed during initial evaluation. The only
 * fields that are inaccessible are those that don't exist yet 'cause the
 * initial evaluation is supposed to create them.
 */
export type PartialAtomInstance = Omit<
  AnyAtomInstance,
  'api' | 'exports' | 'promise' | 'S'
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

export type RecursivePartial<T> = T extends Record<string, any>
  ? { [P in keyof T]?: RecursivePartial<T[P]> }
  : T

export type Ref<T = any> = MutableRefObject<T>

export interface RefObject<T = any> {
  readonly current: T | null
}

export type Scope = Map<
  Record<string, any>,
  WeakRef<any> | number | string | boolean | null | undefined
>

export type Selectable<State = any, Params extends any[] = any> =
  | AtomSelectorOrConfig<State, Params>
  | SelectorInstance<{
      Params: Params
      State: State
      Template: AtomSelectorOrConfig<State, Params>
    }>

export type Settable<State = any, StateIn = State> =
  | ((state: StateIn) => State)
  | State

export type StateHookTuple<State, Exports> = [
  State,
  ExportsInfusedSetter<State, Exports>
]
