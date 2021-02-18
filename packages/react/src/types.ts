import { Context } from 'react'
import { Store } from '@zedux/core'
import { InjectorDescriptor } from './utils/types'

// Base Atom Types
export type AtomConfig<State = any, Params extends any[] = []> =
  | ReadonlyGlobalAtomConfig<State, Params>
  | GlobalAtomConfig<State, Params>
  | ReadonlyAppAtomConfig<State, Params>
  | AppAtomConfig<State, Params>
  | ReadonlyLocalAtomConfig<State, Params>
  | LocalAtomConfig<State, Params>

export type Atom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> = ReadonlyAtom<State, Params, Methods> | ReadWriteAtom<State, Params, Methods>

export type ReadonlyAtom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> =
  | ReadonlyAppAtom<State, Params, Methods>
  | ReadonlyGlobalAtom<State, Params, Methods>
  | ReadonlyLocalAtom<State, Params, Methods>

export type ReadWriteAtom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> =
  | AppAtom<State, Params, Methods>
  | GlobalAtom<State, Params, Methods>
  | LocalAtom<State, Params, Methods>

export type AtomInstance<
  State = any,
  Methods extends Record<string, () => any> = Record<string, () => any>
> = ReadWriteAtomInstance<State, Methods> | ReadonlyAtomInstance<State, Methods>

export type ReadWriteAtomInstance<
  State = any,
  Methods extends Record<string, () => any> = Record<string, () => any>
> =
  | AppAtomInstance<State, Methods>
  | GlobalAtomInstance<State, Methods>
  | LocalAtomInstance<State, Methods>

export type ReadonlyAtomInstance<
  State = any,
  Methods extends Record<string, () => any> = Record<string, () => any>
> =
  | ReadonlyAppAtomInstance<State, Methods>
  | ReadonlyGlobalAtomInstance<State, Methods>
  | ReadonlyLocalAtomInstance<State, Methods>

export type SharedAtomConfigOptions = 'flags' | 'key' | 'value'
export type SharedTtlAtomConfigOptions = SharedAtomConfigOptions | 'ttl'

export interface AtomBase<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>,
  ScopeType extends Scope = Scope,
  Readonly extends boolean = boolean,
  AtomType extends Atom<State, Params> = Atom<State, Params>,
  InstanceType extends AtomInstance<State> = AtomInstance<State>
> extends AtomBaseProperties<State, Params, ScopeType, Readonly> {
  getReactContext: () => Context<InstanceType>
  injectInstance: (
    ...params: Params
  ) => Readonly extends true
    ? ReadonlyAtomInstanceInjectorApi<State, Methods>
    : ReadWriteAtomInstanceInjectorApi<State, Methods>
  injectMethods: (...params: Params) => Methods
  injectValue: (...params: Params) => State
  override: (
    newValue: AtomValue<State> | ((...params: Params) => AtomValue<State>)
  ) => AtomType
  useInstance: (
    ...params: Params
  ) => Readonly extends true
    ? ReadonlyAtomInstanceReactApi<State, Methods>
    : ReadWriteAtomInstanceReactApi<State, Methods>
  useMethods: (...params: Params) => Methods
  useValue: (...params: Params) => State
}

export interface AtomBaseProperties<
  State = any,
  Params extends any[] = [],
  ScopeType extends Scope = Scope,
  Readonly extends boolean = boolean
> {
  flags?: string[]
  internalId: string
  key: string
  // molecules?: Molecule[]
  readonly?: Readonly
  scope: ScopeType
  ttl?: Ttl
  value: AtomValue<State> | ((...params: Params) => AtomValue<State>)
}

export interface AtomInstanceBase<
  State = any,
  Methods extends Record<string, () => any> = Record<string, () => any>
> {
  activeState: ActiveState
  dependencies: Record<string, string>
  destructionTimeout?: ReturnType<typeof setTimeout>
  implementationId: string
  injectMethods: () => Methods
  injectValue: () => State
  injectors: InjectorDescriptor[]
  internalId: string
  key: string
  keyHash: string
  stateStore: Store<State>
  stateType: StateType
  useMethods: () => Methods
  useValue: () => State // Not for local atoms
}

export interface ReadWriteAtomInstanceReactApi<
  State = any,
  Methods extends Record<string, () => any> = Record<string, () => any>
> extends Pick<AtomInstanceBase<State, Methods>, 'useMethods' | 'useValue'> {
  useState: () => ReturnType<StateHook<State>>
}

export interface ReadWriteAtomInstanceInjectorApi<
  State = any,
  Methods extends Record<string, () => any> = Record<string, () => any>
> extends Pick<
    AtomInstanceBase<State, Methods>,
    'injectMethods' | 'injectValue'
  > {
  injectState: () => ReturnType<StateInjector<State>>
}

export type ReadonlyAtomInstanceReactApi<
  State = any,
  Methods extends Record<string, () => any> = Record<string, () => any>
> = Pick<AtomInstanceBase<State, Methods>, 'useMethods' | 'useValue'>

export type ReadonlyAtomInstanceInjectorApi<
  State = any,
  Methods extends Record<string, () => any> = Record<string, () => any>
> = Pick<AtomInstanceBase<State, Methods>, 'injectMethods' | 'injectValue'>

// App Atoms
export interface AppAtomConfig<State = any, Params extends any[] = []>
  extends Pick<AppAtom<State, Params>, SharedTtlAtomConfigOptions> {
  readonly?: false
  scope?: Scope.App
}

export interface ReadonlyAppAtomConfig<State = any, Params extends any[] = []>
  extends Pick<ReadonlyAppAtom<State, Params>, SharedTtlAtomConfigOptions> {
  readonly: true
  scope?: Scope.App
}

export interface AppAtom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> extends AtomBase<
    State,
    Params,
    Methods,
    Scope.App,
    false,
    AppAtom<State, Params>,
    AppAtomInstance<State>
  > {
  injectState: StateInjector<State, Params>
  useState: StateHook<State, Params>
}

export type ReadonlyAppAtom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> = AtomBase<
  State,
  Params,
  Methods,
  Scope.App,
  true,
  ReadonlyAppAtom<State, Params>,
  ReadonlyAppAtomInstance<State>
>

export type AppAtomInstance<
  State = any,
  Methods extends Record<string, () => any> = Record<string, () => any>
> = AtomInstanceBase<State, Methods>

export type ReadonlyAppAtomInstance<
  State = any,
  Methods extends Record<string, () => any> = Record<string, () => any>
> = AtomInstanceBase<State, Methods>

// Global Atoms
export interface GlobalAtomConfig<State = any, Params extends any[] = []>
  extends Pick<GlobalAtom<State, Params>, SharedTtlAtomConfigOptions> {
  readonly?: false
  scope: Scope.Global
}

export interface ReadonlyGlobalAtomConfig<
  State = any,
  Params extends any[] = []
> extends Pick<ReadonlyGlobalAtom<State, Params>, SharedTtlAtomConfigOptions> {
  readonly: true
  scope: Scope.Global
}

export interface GlobalAtom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> extends AtomBase<
    State,
    Params,
    Methods,
    Scope.Global,
    false,
    GlobalAtom<State, Params>,
    GlobalAtomInstance<State>
  > {
  injectState: StateInjector<State, Params>
  useState: StateHook<State, Params>
}

export type ReadonlyGlobalAtom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> = AtomBase<
  State,
  Params,
  Methods,
  Scope.Global,
  true,
  ReadonlyGlobalAtom<State, Params>,
  ReadonlyGlobalAtomInstance<State>
>

export type GlobalAtomInstance<
  State = any,
  Methods extends Record<string, () => any> = Record<string, () => any>
> = AtomInstanceBase<State, Methods>

export type ReadonlyGlobalAtomInstance<
  State = any,
  Methods extends Record<string, () => any> = Record<string, () => any>
> = AtomInstanceBase<State, Methods>

// Local Atoms
export interface LocalAtomConfig<State = any, Params extends any[] = []>
  extends Pick<LocalAtom<State, Params>, SharedAtomConfigOptions> {
  readonly?: false
  scope: Scope.Local
  ttl?: 0
}

export interface ReadonlyLocalAtomConfig<State = any, Params extends any[] = []>
  extends Pick<ReadonlyLocalAtom<State, Params>, SharedAtomConfigOptions> {
  readonly: true
  scope: Scope.Local
  ttl?: 0
}

export interface LocalAtom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> extends AtomBase<
    State,
    Params,
    Methods,
    Scope.Local,
    false,
    LocalAtom<State, Params>,
    LocalAtomInstance<State>
  > {
  injectState: StateInjector<State, Params>
  ttl?: 0
  useState: StateHook<State, Params>
}

export interface ReadonlyLocalAtom<
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
> extends AtomBase<
    State,
    Params,
    Methods,
    Scope.Local,
    true,
    ReadonlyLocalAtom<State, Params>,
    ReadonlyLocalAtomInstance<State>
  > {
  ttl?: 0
}

export type LocalAtomInstance<
  State = any,
  Methods extends Record<string, () => any> = Record<string, () => any>
> = AtomInstanceBase<State, Methods>

export type ReadonlyLocalAtomInstance<
  State = any,
  Methods extends Record<string, () => any> = Record<string, () => any>
> = AtomInstanceBase<State, Methods>

// Other

export enum ActiveState {
  Active = 'Active',
  Destroyed = 'Destroyed',
  Destroying = 'Destroying',
}

export type AtomValue<State = any> = State | Store<State>

export type StateHook<State = any, Params extends any[] = []> = (
  ...params: Params
) => [State, Store<State>['setState']]

export type StateInjector<State = any, Params extends any[] = []> = (
  ...params: Params
) => [State, Store<State>['setState'], Store<State>]

export enum StateType {
  Store,
  Value,
}

// TODO: Molecules are just atoms now (:exploding_head:)
export interface Molecule {
  key: string
}

export interface ReadonlyStore<State = any> {
  getState: Store<State>['getState']
}

export interface RefObject<T = any> {
  readonly current: T | null
}

export enum Scope {
  App = 'App',
  Global = 'Global',
  Local = 'Local',
}

export type Ttl = number // | Observable<any> - not implementing observable ttl for now // Not for local atoms
