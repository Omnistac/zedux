import {
  AsyncStore,
  Cleanup,
  DependentEdge,
  GraphEdgeDynamicity,
  MutableRefObject,
  RefObject,
} from '@zedux/react/types'
import { Store, Subscription } from '@zedux/core'
import { AtomInstanceBase } from '../classes/instances/AtomInstanceBase'
import { AtomInstance } from '../classes/instances/AtomInstance'

export interface AsyncEffectInjectorDescriptor<T>
  extends DepsInjectorDescriptor {
  cleanupTask?: Cleanup
  asyncStore: AsyncStore<T>
  promise: Promise<T>
  rejectRef?: (err: any) => void
  resolveRef?: (val: any) => void
  subscription: Subscription
  type: InjectorType.AsyncEffect
}

export interface AtomInjectorDescriptor<
  InstanceType extends AtomInstanceBase<any, any[], any>
> extends InjectorDescriptor {
  instance: InstanceType
  shouldRegisterDependency: boolean
  type: InjectorType.Atom
}

export interface AtomDynamicInjectorDescriptor<
  InstanceType extends AtomInstanceBase<any, any[], any>
> extends InjectorDescriptor {
  instance: InstanceType
  type: InjectorType.AtomDynamic
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

export interface Dep<T = any> {
  cleanup?: Cleanup
  instance: AtomInstanceBase<T, any, any>
  dynamicity: GraphEdgeDynamicity
  materialize?: () => void
  memoizedVal?: any
  shouldUpdate?: (newState: T) => boolean
}

export interface DepsInjectorDescriptor extends InjectorDescriptor {
  deps?: any[]
}

export interface DiContext {
  injectors: InjectorDescriptor[]
  instance: AtomInstance<any, any[], any>
}

export interface EcosystemGraphNode {
  dependencies: Record<string, true>
  dependents: Record<string, DependentEdge>
  weight: number
}

export interface EffectInjectorDescriptor extends DepsInjectorDescriptor {
  type: InjectorType.Effect
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

export interface InjectorDescriptor {
  cleanup?: () => void
  type: InjectorType
}

export enum InjectorType {
  AsyncEffect = 'AsyncEffect',
  Atom = 'Atom',
  AtomDynamic = 'AtomDynamic',
  Effect = 'Effect',
  Exports = 'Exports',
  Memo = 'Memo',
  Ref = 'Ref',
  Selector = 'Selector',
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
  instance: AtomInstanceBase<State, any, any>
  selector: (state: State) => D
  selectorResult: D
  type: InjectorType.Selector
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
  type: InjectorType.Why
}
