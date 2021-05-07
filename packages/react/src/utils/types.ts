import {
  AtomBaseProperties,
  AtomInstanceBase,
  RefObject,
} from '@zedux/react/types'
import { ActionChain, Store } from '@zedux/core'

export interface AtomInjectorDescriptor<
  InstanceType extends AtomInstanceBase<any, any>
> extends InjectorDescriptor {
  instance: InstanceType
  type: InjectorType.Atom
}

export interface AtomWithSubscriptionInjectorDescriptor<
  InstanceType extends AtomInstanceBase<any, any>
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
}

export interface DepsInjectorDescriptor extends InjectorDescriptor {
  deps?: any[]
}

export interface DiContext {
  ecosystemId: string
  atom: AtomBaseProperties<any, any[]>
  injectors: InjectorDescriptor[]
  isInitializing: boolean
  keyHash: string
  prevInjectors?: InjectorDescriptor[]
  scheduleEvaluation: (reason: EvaluationReason) => void
}

export interface EcosystemGraphNode {
  dependencies: Record<string, true>
  dependents: Record<string, DependentEdge>
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
  State = 'State',
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
  ref: RefObject<T>
}

export interface RunEffectJob extends JobBase {
  type: JobType.RunEffect
}

export interface StateInjectorDescriptor<State = any>
  extends InjectorDescriptor {
  store: Store<State>
  type: InjectorType.State
}

export interface UpdateExternalDependentJob extends JobBase {
  flagScore: number
  type: JobType.UpdateExternalDependent
}

export interface WhyInjectorDescriptor extends InjectorDescriptor {
  callback: (reasons: EvaluationReason[]) => unknown
}
