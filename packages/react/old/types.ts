import React from 'react'
import { Observable } from 'rxjs'
import { Store } from '@zedux/core'

export enum ActiveState {
  active = 'active',
  destroyed = 'destroyed',
  destroying = 'destroying',
}

export type AppAtom<T = any, A extends any[] = []> = AtomBase<T, A>

export type Atom<T = any, A extends any[] = []> =
  | AppAtom<T, A>
  | GlobalAtom<T, A>
  | LocalAtom<T, A>

export interface AtomBase<T = any, A extends any[] = []> {
  enhancedFactory?: (utils: AtomUtils) => (...params: A) => AtomValue<T> // TODO: must specify either enhancedFactory or factory. Couldn't get a union type to work for this...
  enhancedOverride: (
    newEnhancedFactory: (utils: AtomUtils) => (...params: A) => AtomValue<T>
  ) => Atom<T, A>
  factory?: (...params: A) => AtomValue<T>
  getOptions?: (utils: AtomUtils) => AtomConfig<T, A> & { scope?: 'app' }
  internalId: string
  isTestSafe?: boolean
  key: string
  molecules?: Molecule[]
  override: (newFactory: (...params: A) => AtomValue<T>) => Atom<T, A> // TODO: hm, should this (`Atom`) be more specific
  scope: Scope
  ttl?: number | Observable<any>
  useApi: (
    ...params: A
  ) => {
    activeState?: ActiveState
    dispatch?: Store<T>['dispatch']
    readyState: ReadyState
    setState?: Store<T>['setState']
    state?: T
  }
  useState: (...params: A) => [T | undefined, Store<T>['setState']]
}

export interface AtomInstance<T = any> {
  addSubscriber: (subscriber: Subscriber<AtomMetadata<T>>) => () => void // TODO: maybe Zedux could propagate an effect on subscribe
  dependencies?: [string, string][]
  fullKey: string
  implementation: string
  internalId: string
  key: string
  metaStore: Store<AtomMetadata<T>>
  stateStore?: Store<T>
  ttl?: number | Observable<any>
}

export interface AtomMetadata<T = any> {
  activeState: ActiveState
  destructionTimeout: ReturnType<typeof setTimeout>
  readyState: ReadyState
  state?: T
  subscriberCount: number
}

export interface AtomSubscription<T = any> {
  atomInstance: AtomInstance<T>
  unsubscribe: () => void
}

export interface AtomUtils {
  injectState: {
    <T extends any, A extends any[]>(atom: Atom<T, A>, params: A): T
    <T extends any>(atom: Atom<T>): T
  }
  injectStore: {
    <T extends any, A extends any[]>(atom: Atom<T, A>, params: A): Store<T>
    <T extends any>(atom: Atom<T>): Store<T>
  }
}

export type AtomValue<T = any> =
  | AtomValueResolved<T>
  | Promise<AtomValueResolved<T>>

export type AtomValueResolved<T = any> = T | Observable<T> | Store<T>

export type AtomConfig<T = any, A extends any[] = []> = Pick<
  Atom<T, A>,
  'enhancedFactory' | 'factory' | 'isTestSafe' | 'key' | 'molecules' | 'ttl'
>

export type GlobalAtom<T = any, A extends any[] = []> = AtomBase<T, A>

export interface LocalAtom<T = any, A extends any[] = []>
  extends AtomBase<T, A> {
  context: React.Context<[string, string]>
  useLocalAtom: (...params: A) => LocalAtomInstance<T>
}

export type LocalAtomInstance<T = any> = {
  Provider: React.ComponentType
} & Partial<AtomInstance<T>>

export interface Molecule<T = any> {
  addAtom: (atom: AtomInstance<T>) => void
  key: string
  store: Store<Record<string, AtomMetadata<T>>>
  useValue: () => T[]
}

// TODO: What was this? Probably delete:
export type PoolStore = Store<Record<string, AtomInstance>>

export enum ReadyState {
  error = 'error',
  initializing = 'initializing',
  ready = 'ready',
  waiting = 'waiting',
}

export enum Scope {
  app = 'app',
  global = 'global',
  local = 'local',
}

export type Subscriber<T = any> = (val: T) => unknown
