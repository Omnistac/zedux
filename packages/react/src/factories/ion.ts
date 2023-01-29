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
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    value: (
      getters: AtomGetters,
      ...params: Params
    ) => AtomApi<Promise<State>, Exports, undefined, PromiseType>,
    config?: AtomConfig<State>
  ): Ion<
    PromiseState<State>,
    Params,
    Exports,
    Store<PromiseState<State>>,
    PromiseType
  >

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
  ): Ion<StoreStateType<StoreType>, Params, Exports, StoreType, PromiseType>

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
  ): Ion<State, Params, Exports, Store<State>, PromiseType>

  // Catch-all
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>,
    StoreType extends Store<any> = Store<any>,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    get: IonStateFactory<State, Params, Exports, StoreType, PromiseType>,
    config?: AtomConfig<State>
  ): Ion<State, Params, Exports, StoreType, PromiseType>
} = <
  State = any,
  Params extends any[] = [],
  Exports extends Record<string, any> = Record<string, never>,
  StoreType extends Store<State> = Store<State>,
  PromiseType extends AtomApiPromise = undefined
>(
  key: string,
  get: IonStateFactory<State, Params, Exports, StoreType, PromiseType>,
  config?: AtomConfig<State>
) => new Ion(key, get, config)
