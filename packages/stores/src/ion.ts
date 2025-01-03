import { AtomConfig, AtomGetters, PromiseState } from '@zedux/atoms'
import { Store, StoreStateType } from '@zedux/core'
import { AtomApi } from './AtomApi'
import { IonTemplate, IonTemplateRecursive } from './IonTemplate'
import { AtomApiPromise, IonStateFactory } from './types'

export const ion: {
  // Query Atoms
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>
  >(
    key: string,
    value: (
      getters: AtomGetters,
      ...params: Params
    ) => AtomApi<{
      Exports: Exports
      Promise: any
      State: Promise<State>
      Store: undefined
    }>,
    config?: AtomConfig<State>
  ): IonTemplateRecursive<{
    State: PromiseState<State>
    Params: Params
    Events: Record<string, never>
    Exports: Exports
    Store: Store<PromiseState<State>>
    Promise: Promise<State>
  }>

  // Custom Stores
  <
    StoreType extends Store<any> = Store<any>,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    get: (
      getters: AtomGetters,
      ...params: Params
    ) =>
      | StoreType
      | AtomApi<{
          Exports: Exports
          Promise: PromiseType
          State: StoreStateType<Store>
          Store: StoreType
        }>,
    config?: AtomConfig<StoreStateType<StoreType>>
  ): IonTemplateRecursive<{
    State: StoreStateType<StoreType>
    Params: Params
    Events: Record<string, never>
    Exports: Exports
    Store: StoreType
    Promise: PromiseType
  }>

  // No Store
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    get: (
      getters: AtomGetters,
      ...params: Params
    ) =>
      | AtomApi<{
          Exports: Exports
          Promise: PromiseType
          State: State
          Store: undefined
        }>
      | State,
    config?: AtomConfig<State>
  ): IonTemplateRecursive<{
    State: State
    Params: Params
    Events: Record<string, never>
    Exports: Exports
    Store: Store<State>
    Promise: PromiseType
  }>

  // Catch-all
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>,
    StoreType extends Store<any> = Store<any>,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    get: IonStateFactory<{
      State: State
      Params: Params
      Events: Record<string, never>
      Exports: Exports
      Store: StoreType
      Promise: PromiseType
    }>,
    config?: AtomConfig<State>
  ): IonTemplateRecursive<{
    State: State
    Params: Params
    Events: Record<string, never>
    Exports: Exports
    Store: StoreType
    Promise: PromiseType
  }>
} = <
  State = any,
  Params extends any[] = [],
  Exports extends Record<string, any> = Record<string, never>,
  StoreType extends Store<State> = Store<State>,
  PromiseType extends AtomApiPromise = undefined
>(
  key: string,
  get: IonStateFactory<{
    State: State
    Params: Params
    Events: Record<string, never>
    Exports: Exports
    Store: StoreType
    Promise: PromiseType
  }>,
  config?: AtomConfig<State>
) => new IonTemplate(key, get, config) as any
