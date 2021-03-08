import { Context } from 'react'
import { Dispatcher, StateSetter, Store } from '@zedux/core'
import { EvaluationReason, InjectorDescriptor } from './utils/types'

export enum ActiveState {
  Active = 'Active',
  Destroyed = 'Destroyed',
  Destroying = 'Destroying',
}

export interface AtomInstance<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> {
  activeState: ActiveState
  dependencies: Record<string, string>
  destructionTimeout?: ReturnType<typeof setTimeout>
  getEvaluationReasons: () => EvaluationReason[]
  implementationId: string
  injectExports: () => Exports
  injectValue: () => State
  injectors: InjectorDescriptor[]
  internalId: string
  invalidate: (reason: EvaluationReason) => void
  key: string
  keyHash: string
  Provider: React.ComponentType
  params: Params
  stateStore: Store<State>
  stateType: StateType
  useExports: () => Exports
  useValue: () => State // Not for local atoms
}

export interface AtomInstanceApi<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends ReadonlyAtomInstanceApi<State, Params, Exports> {
  injectDispatch: () => Dispatcher<State>
  injectSetState: () => StateSetter<State>
  injectState: () => readonly [State, Store<State>['setState'], Store<State>]
  injectStore: () => Store<State>
  useDispatch: () => Dispatcher<State>
  useSetState: () => StateSetter<State>
  useState: () => readonly [State, Store<State>['setState']]
  useStore: () => Store<State>
}

export type AtomValue<State = any> = State | Store<State>

// ReadonlyApp and ReadonlyGlobal atoms are "ReadonlyStandard" atoms
export interface ReadonlyStandardAtom<
  State,
  Params extends any[],
  Exports extends Record<string, any>,
  AtomInstanceApiType extends ReadonlyAtomInstanceApi<
    State,
    Params,
    Exports
  > = ReadonlyAtomInstanceApi<State, Params, Exports>
> {
  injectExports: (...params: Params) => Exports
  injectInstance: (...params: Params) => AtomInstanceApiType
  injectInvalidate: (...params: Params) => () => void
  injectLazy: () => (...params: Params) => Store<State>
  injectSelector: Params extends []
    ? <D = any>(selector: (state: State) => D) => D
    : <D = any>(params: Params, selector: (state: State) => D) => D
  injectValue: (...params: Params) => State
  override: (
    newValue: AtomValue<State> | ((...params: Params) => AtomValue<State>)
  ) => ReadonlyStandardAtom<State, Params, Exports>
  useConsumer: () => AtomInstanceApiType
  useExports: (...params: Params) => Exports
  useInstance: (...params: Params) => AtomInstanceApiType
  useInvalidate: (...params: Params) => () => void
  useLazy: () => (...params: Params) => Store<State>
  useSelector: Params extends []
    ? <D = any>(selector: (state: State) => D) => D
    : <D = any>(params: Params, selector: (state: State) => D) => D
  useValue: (...params: Params) => State
}

export interface ReadonlyAtomInstanceApi<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> {
  injectExports: () => Exports
  injectInvalidate: () => () => void
  injectLazy: () => () => Store<State>
  injectSelector: <D = any>(selector: (state: State) => D) => D
  injectValue: () => State
  params: Params
  useExports: () => Exports
  useInvalidate: () => () => void
  useLazy: () => () => Store<State>
  useSelector: <D = any>(selector: (state: State) => D) => D
  useValue: () => State
}

// App and Global atoms are "Standard" atoms
export interface StandardAtom<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends ReadonlyStandardAtom<
    State,
    Params,
    Exports,
    AtomInstanceApi<State, Params, Exports>
  > {
  injectDispatch: (...params: Params) => Dispatcher<State>
  injectSetState: (...params: Params) => StateSetter<State>
  injectState: (
    ...params: Params
  ) => readonly [State, Store<State>['setState'], Store<State>]
  injectStore: (...params: Params) => Store<State>
  useDispatch: (...params: Params) => Dispatcher<State>
  useSetState: (...params: Params) => StateSetter<State>
  useState: (...params: Params) => readonly [State, Store<State>['setState']]
  useStore: (...params: Params) => Store<State>
}

export enum StateType {
  Store,
  Value,
}
