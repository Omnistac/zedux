import { Context } from 'react'
import { Dispatcher, Store } from '@zedux/core'
import { EvaluationReason, InjectorDescriptor } from './utils/types'

export enum ActiveState {
  Active = 'Active',
  Destroyed = 'Destroyed',
  Destroying = 'Destroying',
}

export type AtomValue<State = any> = State | Store<State>

// ReadonlyApp and ReadonlyGlobal atoms are "ReadonlyStandard" atoms
export interface ReadonlyStandardAtom<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> {
  injectInstance: (...params: Params) => AtomInstanceApi<State, Params, Exports>
  injectInvalidate: (...params: Params) => () => void
  injectLazy: () => (...params: Params) => Store<State>
  injectExports: (...params: Params) => Exports
  injectSelector: Params extends []
    ? <D = any>(selector: (state: State) => D) => D
    : <D = any>(params: Params, selector: (state: State) => D) => D
  injectValue: (...params: Params) => State
  override: (
    newValue: AtomValue<State> | ((...params: Params) => AtomValue<State>)
  ) => ReadonlyStandardAtom<State, Params, Exports>
  useConsumer: () => AtomInstanceApi<State, Params, Exports>
  useInstance: (...params: Params) => AtomInstanceApi<State, Params, Exports>
  useInvalidate: (...params: Params) => () => void
  useLazy: () => (...params: Params) => Store<State>
  useExports: (...params: Params) => Exports
  useSelector: Params extends []
    ? <D = any>(selector: (state: State) => D) => D
    : <D = any>(params: Params, selector: (state: State) => D) => D
  useValue: (...params: Params) => State
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
> extends AtomInstance<State, Params, Exports> {
  injectInvalidate: () => () => void
  injectLazy: () => () => Store<State>
  injectExports: () => Exports
  injectValue: () => State
  override: (
    newValue: AtomValue<State> | (() => AtomValue<State>)
  ) => ReadonlyStandardAtom<State, Params, Exports>
  useInvalidate: () => () => void
  useLazy: () => () => Store<State>
  useExports: () => Exports
  useValue: () => State
}

// App and Global atoms are "Standard" atoms
export interface StandardAtom<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends ReadonlyStandardAtom<State, Params, Exports> {
  injectState: StateInjector<State, Params>
  useState: StateHook<State, Params>
}

export type StateHook<State = any, Params extends any[] = []> = (
  ...params: Params
) => readonly [State, Store<State>['setState']]

export type StateInjector<State = any, Params extends any[] = []> = (
  ...params: Params
) => readonly [State, Store<State>['setState'], Store<State>]

export enum StateType {
  Store,
  Value,
}
