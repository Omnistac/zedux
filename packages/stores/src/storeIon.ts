import { AtomConfig, AtomGetters, None, PromiseState } from '@zedux/atoms'
import { Store, StoreStateType } from '@zedux/core'
import { StoreAtomApi } from './StoreAtomApi'
import { StoreIonTemplate, StoreIonTemplateRecursive } from './StoreIonTemplate'
import { StoreAtomApiPromise, StoreIonStateFactory } from './types'

export const storeIon: {
  // Query Atoms
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = None
  >(
    key: string,
    value: (
      getters: AtomGetters,
      ...params: Params
    ) => StoreAtomApi<{
      Exports: Exports
      Promise: any
      State: Promise<State>
      Store: undefined
    }>,
    config?: AtomConfig<State>
  ): StoreIonTemplateRecursive<{
    State: PromiseState<State>
    Params: Params
    Events: None
    Exports: Exports
    Store: Store<PromiseState<State>>
    Promise: Promise<State>
  }>

  // Custom Stores
  <
    StoreType extends Store<any> = Store<any>,
    Params extends any[] = [],
    Exports extends Record<string, any> = None,
    PromiseType extends StoreAtomApiPromise = undefined
  >(
    key: string,
    get: (
      getters: AtomGetters,
      ...params: Params
    ) =>
      | StoreType
      | StoreAtomApi<{
          Exports: Exports
          Promise: PromiseType
          State: StoreStateType<Store>
          Store: StoreType
        }>,
    config?: AtomConfig<StoreStateType<StoreType>>
  ): StoreIonTemplateRecursive<{
    State: StoreStateType<StoreType>
    Params: Params
    Events: None
    Exports: Exports
    Store: StoreType
    Promise: PromiseType
  }>

  // No Store
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = None,
    PromiseType extends StoreAtomApiPromise = undefined
  >(
    key: string,
    get: (
      getters: AtomGetters,
      ...params: Params
    ) =>
      | StoreAtomApi<{
          Exports: Exports
          Promise: PromiseType
          State: State
          Store: undefined
        }>
      | State,
    config?: AtomConfig<State>
  ): StoreIonTemplateRecursive<{
    State: State
    Params: Params
    Events: None
    Exports: Exports
    Store: Store<State>
    Promise: PromiseType
  }>

  // Catch-all
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = None,
    StoreType extends Store<any> = Store<any>,
    PromiseType extends StoreAtomApiPromise = undefined
  >(
    key: string,
    get: StoreIonStateFactory<{
      State: State
      Params: Params
      Events: None
      Exports: Exports
      Store: StoreType
      Promise: PromiseType
    }>,
    config?: AtomConfig<State>
  ): StoreIonTemplateRecursive<{
    State: State
    Params: Params
    Events: None
    Exports: Exports
    Store: StoreType
    Promise: PromiseType
  }>
} = <
  State = any,
  Params extends any[] = [],
  Exports extends Record<string, any> = None,
  StoreType extends Store<State> = Store<State>,
  PromiseType extends StoreAtomApiPromise = undefined
>(
  key: string,
  get: StoreIonStateFactory<{
    State: State
    Params: Params
    Events: None
    Exports: Exports
    Store: StoreType
    Promise: PromiseType
  }>,
  config?: AtomConfig<State>
) => new StoreIonTemplate(key, get, config)
