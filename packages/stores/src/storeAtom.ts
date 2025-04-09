import { AtomConfig, AtomApiPromise, PromiseState, None } from '@zedux/atoms'
import { Store, StoreStateType } from '@zedux/core'
import { StoreAtomApi } from './StoreAtomApi'
import {
  StoreAtomTemplate,
  StoreAtomTemplateRecursive,
} from './StoreAtomTemplate'
import { StoreAtomValueOrFactory } from './types'

export const storeAtom: {
  // Query Atoms
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = None
  >(
    key: string,
    value: (...params: Params) => StoreAtomApi<{
      Exports: Exports
      Promise: any
      State: Promise<State>
      Store: undefined
    }>,
    config?: AtomConfig<State>
  ): StoreAtomTemplateRecursive<{
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
    PromiseType extends AtomApiPromise = undefined,
    ResolvedState = StoreStateType<StoreType>
  >(
    key: string,
    value: (...params: Params) =>
      | StoreType
      | StoreAtomApi<{
          Exports: Exports
          Promise: PromiseType
          ResolvedState: ResolvedState
          State: StoreStateType<Store>
          Store: StoreType
        }>,
    config?: AtomConfig<StoreStateType<StoreType>>
  ): StoreAtomTemplateRecursive<{
    State: StoreStateType<StoreType>
    Params: Params
    Events: None
    Exports: Exports
    ResolvedState: ResolvedState
    Store: StoreType
    Promise: PromiseType
  }>

  // Catch-all
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = None,
    StoreType extends Store<State> = Store<State>,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    value: StoreAtomValueOrFactory<{
      Events: None
      Exports: Exports
      Params: Params
      Promise: PromiseType
      State: State
      Store: StoreType
    }>,
    config?: AtomConfig<State>
  ): StoreAtomTemplateRecursive<{
    Events: None
    Exports: Exports
    Params: Params
    Promise: PromiseType
    State: State
    Store: StoreType
  }>
} = <
  State = any,
  Params extends any[] = [],
  Exports extends Record<string, any> = None,
  StoreType extends Store<State> = Store<State>,
  PromiseType extends AtomApiPromise = undefined
>(
  key: string,
  value: StoreAtomValueOrFactory<{
    Events: None
    Exports: Exports
    Params: Params
    Promise: PromiseType
    State: State
    Store: StoreType
  }>,
  config?: AtomConfig<State>
) => {
  if (DEV && !key) {
    throw new TypeError('Zedux: All atoms must have a key')
  }

  return new StoreAtomTemplate(key, value, config)
}
