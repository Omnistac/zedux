import { AtomBaseProperties, RefObject } from '@zedux/react/types'
import { ActionChain, Store } from '@zedux/core'

export interface AtomInjectorDescriptor extends InjectorDescriptor {
  instanceId: string
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

export interface DepsInjectorDescriptor extends InjectorDescriptor {
  deps?: any[]
}

export interface DiContext {
  appId: string
  atom: AtomBaseProperties<any, any[]>
  injectors: InjectorDescriptor[]
  isInitializing: boolean
  prevInjectors?: InjectorDescriptor[]
  scheduleEvaluation: (reason: EvaluationReason) => void
}

export interface EffectInjectorDescriptor extends DepsInjectorDescriptor {
  isCleanedUp?: boolean
  type: InjectorType.Effect
}

export enum EvaluationType {
  CacheInvalidated = 'cache invalidated',
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

export interface InjectorDescriptor {
  cleanup?: () => void
  type: string
}

export enum InjectorType {
  Atom = 'Atom',
  Effect = 'Effect',
  Exports = 'Exports',
  Memo = 'Memo',
  Ref = 'Ref',
  State = 'State',
  Why = 'Why',
}

export interface Job {
  type: string
  task: () => void
}

export interface MemoInjectorDescriptor<State = any>
  extends DepsInjectorDescriptor {
  memoizedVal: State
  type: InjectorType.Memo
}

export interface RefInjectorDescriptor<T = any> extends InjectorDescriptor {
  ref: RefObject<T>
}

export interface StateInjectorDescriptor<State = any>
  extends InjectorDescriptor {
  store: Store<State>
  type: InjectorType.State
}

export interface WhyInjectorDescriptor extends InjectorDescriptor {
  callback: (reasons: EvaluationReason[]) => unknown
}
