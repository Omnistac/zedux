import {
  AnyAtomInstance,
  AtomSelectorOrConfig,
  DependentEdge,
  EvaluationReason,
  MutableRefObject,
  RefObject,
} from '@zedux/react/types'
import { MachineStore, Store } from '@zedux/core'
import { AtomInstanceBase } from '../classes/instances/AtomInstanceBase'

export interface AtomInjectorDescriptor<
  InstanceType extends AtomInstanceBase<any, any[], any>
> extends InjectorDescriptor {
  instance: InstanceType
  type: InjectorType.Atom
}

export interface AtomDynamicInjectorDescriptor<
  InstanceType extends AtomInstanceBase<any, any[], any>
> extends InjectorDescriptor {
  instance: InstanceType
  type: InjectorType.AtomDynamic
}

export interface AtomSelectorCache<T = any, Args extends any[] = any[]> {
  args?: Args
  cacheKey: string
  isDestroyed?: true
  nextEvaluationReasons: EvaluationReason[]
  prevEvaluationReasons?: EvaluationReason[]
  result?: T
  selectorRef: AtomSelectorOrConfig<T, Args>
  task?: () => void
}

export interface DepsInjectorDescriptor extends InjectorDescriptor {
  deps?: any[]
}

export interface EcosystemGraphNode {
  dependencies: Record<string, true>
  dependents: Record<string, DependentEdge>
  isAtomSelector?: boolean
  weight: number
}

export interface EffectInjectorDescriptor extends DepsInjectorDescriptor {
  type: InjectorType.Effect
}

export interface EvaluateNodeJob extends JobBase {
  flags: number
  keyHash: string
  type: JobType.EvaluateNode
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
  MachineStore = 'MachineStore',
  Memo = 'Memo',
  Ref = 'Ref',
  Selector = 'Selector',
  Store = 'Store',
  Value = 'Value',
}

export interface JobBase {
  task: () => void
  type: JobType
}

export type Job = EvaluateNodeJob | RunEffectJob | UpdateExternalDependentJob

export enum JobType {
  EvaluateNode = 'EvaluateNode',
  RunEffect = 'RunEffect',
  UpdateExternalDependent = 'UpdateExternalDependent',
}

export interface MachineStoreInjectorDescriptor<
  StateNames extends string,
  EventNames extends string,
  Context extends Record<string, any> | undefined
> extends InjectorDescriptor {
  store: MachineStore<StateNames, EventNames, Context>
  type: InjectorType.MachineStore
}

export interface MemoInjectorDescriptor<Value = any>
  extends DepsInjectorDescriptor {
  memoizedVal: Value
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

export interface StackItemBase {
  /**
   * The cacheKey of the instance or selectorCache
   */
  key: string

  /**
   * the high-def timestamp of when the item was pushed onto the stack
   */
  start?: number
}

export interface InstanceStackItem extends StackItemBase {
  instance: AnyAtomInstance
}

export interface SelectorStackItem extends StackItemBase {
  cache: AtomSelectorCache
}

export type StackItem = InstanceStackItem | SelectorStackItem

export interface StoreInjectorDescriptor<State = any>
  extends InjectorDescriptor {
  store: Store<State>
  type: InjectorType.Store
}

export interface UpdateExternalDependentJob extends JobBase {
  flags: number
  type: JobType.UpdateExternalDependent
}
