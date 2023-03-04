import { Store, StoreStateType } from '@zedux/core'
import { AtomApi } from '../classes'
import { Ion } from '../classes/atoms/Ion'
import {
  AtomConfig,
  AtomGetters,
  AtomApiPromise,
  IonStateFactory,
  PromiseState,
} from '../types'

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
    ) => AtomApi<Promise<State>, Exports, undefined, any>,
    config?: AtomConfig<State>
  ): Ion<{
    State: PromiseState<State>
    Params: Params
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
      | AtomApi<StoreStateType<Store>, Exports, StoreType, PromiseType>,
    config?: AtomConfig<StoreStateType<StoreType>>
  ): Ion<{
    State: StoreStateType<StoreType>
    Params: Params
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
    ) => AtomApi<State, Exports, undefined, PromiseType> | State,
    config?: AtomConfig<State>
  ): Ion<{
    State: State
    Params: Params
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
      Exports: Exports
      Store: StoreType
      Promise: PromiseType
    }>,
    config?: AtomConfig<State>
  ): Ion<{
    State: State
    Params: Params
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
    Exports: Exports
    Store: StoreType
    Promise: PromiseType
  }>,
  config?: AtomConfig<State>
) => new Ion(key, get, config)
