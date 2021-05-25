import { MutableRefObject, RefObject } from '@zedux/react/types'
import { ActionChain, Store } from '@zedux/core'
import { AtomInstanceBase } from '../classes/instances/AtomInstanceBase'
import { AtomBase } from '../classes/atoms/AtomBase'

export interface AtomInjectorDescriptor<
  InstanceType extends AtomInstanceBase<any, any[], AtomBase<any, any[], any>>
> extends InjectorDescriptor {
  instance: InstanceType
  type: InjectorType.Atom
}

export interface AtomWithSubscriptionInjectorDescriptor<
  InstanceType extends AtomInstanceBase<any, any[], any>
> extends InjectorDescriptor {
  instance: InstanceType
  type: InjectorType.AtomWithSubscription
}

export interface CallStackContext<T = any> {
  consume(): T
  consume(throwError: false): T | null
  provide: <R = any>(value: T, callback: () => R) => R
}

export interface CallStackContextInstance<T = any> {
  context: CallStackContext<T>
  value: T
}

export interface DependentEdge {
  callback?: (signal: GraphEdgeSignal, val?: any) => any
  task?: () => void
  isAsync?: boolean
  isExternal?: boolean
  isStatic?: boolean
  operation: string
  shouldUpdate?: (state: any) => boolean
}

export interface DepsInjectorDescriptor extends InjectorDescriptor {
  deps?: any[]
}

export interface DiContext {
  injectors: InjectorDescriptor[]
  instance: AtomInstanceBase<any, any[], any>
}

export interface EcosystemGraphNode {
  dependencies: Record<string, true>
  dependents: Record<string, DependentEdge[]>
  weight: number
}

export interface EffectInjectorDescriptor extends DepsInjectorDescriptor {
  isCleanedUp?: boolean
  type: InjectorType.Effect
}

export enum EvaluationType {
  CacheInvalidated = 'cache invalidated',
  InstanceDestroyed = 'atom instance destroyed',
  StateChanged = 'state changed',
}

export interface EvaluationReason<State = any> {
  action?: ActionChain
  newState?: State
  oldState?: State
  operation: string // e.g. a method like "injectValue"
  targetType: EvaluationTargetType
  targetKey?: string // e.g. an atom like "myAtom"
  targetParams?: any
  reasons?: EvaluationReason[]
  type: EvaluationType
}

export enum EvaluationTargetType {
  Atom = 'Atom',
  AtomContext = 'AtomContext',
  External = 'External',
  Injector = 'Injector',
  Store = 'Store',
}

export interface ExportsInjectorDescriptor<
  Exports extends Record<string, () => any> = Record<string, () => any>
> extends InjectorDescriptor {
  exports: Exports
  type: InjectorType.Exports
}

export interface EvaluateAtomJob extends JobBase {
  flagScore: number
  keyHash: string
  type: JobType.EvaluateAtom
}

export enum GraphEdgeSignal {
  Destroyed = 'Destroyed',
  Updated = 'Updated',
}

export interface InjectorDescriptor {
  cleanup?: () => void
  type: InjectorType
}

export enum InjectorType {
  Atom = 'Atom',
  AtomWithSubscription = 'AtomWithSubscription',
  Effect = 'Effect',
  Exports = 'Exports',
  Memo = 'Memo',
  Ref = 'Ref',
  Selector = 'Selector',
  State = 'State',
  Store = 'Store',
  Value = 'Value',
  Why = 'Why',
}

export interface JobBase {
  task: () => void
  type: JobType
}

export type Job = EvaluateAtomJob | RunEffectJob | UpdateExternalDependentJob

export enum JobType {
  EvaluateAtom = 'EvaluateAtom',
  RunEffect = 'RunEffect',
  UpdateExternalDependent = 'UpdateExternalDependent',
}

export interface MemoInjectorDescriptor<State = any>
  extends DepsInjectorDescriptor {
  memoizedVal: State
  type: InjectorType.Memo
}

export interface RefInjectorDescriptor<T = any> extends InjectorDescriptor {
  ref: RefObject<T> | MutableRefObject<T>
}

export interface RunEffectJob extends JobBase {
  type: JobType.RunEffect
}

export interface SelectorInjectorDescriptor<State = any, D = any>
  extends InjectorDescriptor {
  selector: (state: State) => D
  selectorResult: D
  type: InjectorType.Selector
}

export interface StateInjectorDescriptor<State = any>
  extends InjectorDescriptor {
  store: Store<State>
  type: InjectorType.State
}

export interface StoreInjectorDescriptor<State = any>
  extends InjectorDescriptor {
  store: Store<State>
  type: InjectorType.Store
}

export interface UpdateExternalDependentJob extends JobBase {
  flagScore: number
  type: JobType.UpdateExternalDependent
}

export interface WhyInjectorDescriptor extends InjectorDescriptor {
  callback: (reasons: EvaluationReason[]) => unknown
}
