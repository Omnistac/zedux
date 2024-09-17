import { Store, StoreStateType } from '@zedux/core'
import {
  AtomConfig,
  AtomApiPromise,
  AtomValueOrFactory,
  PromiseState,
} from '../types/index'
import {
  AtomTemplate,
  AtomTemplateRecursive,
} from '../classes/templates/AtomTemplate'
import { AtomApi } from '../classes/AtomApi'

export const atom: {
  // Query Atoms
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>
  >(
    key: string,
    value: (...params: Params) => AtomApi<{
      Exports: Exports
      Promise: any
      State: Promise<State>
      Store: undefined
    }>,
    config?: AtomConfig<State>
  ): AtomTemplateRecursive<{
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
    value: (...params: Params) =>
      | StoreType
      | AtomApi<{
          Exports: Exports
          Promise: PromiseType
          State: StoreStateType<Store>
          Store: StoreType
        }>,
    config?: AtomConfig<StoreStateType<StoreType>>
  ): AtomTemplateRecursive<{
    State: StoreStateType<StoreType>
    Params: Params
    Exports: Exports
    Store: StoreType
    Promise: PromiseType
  }>

  // Catch-all
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>,
    StoreType extends Store<State> = Store<State>,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    value: AtomValueOrFactory<{
      Exports: Exports
      Params: Params
      Promise: PromiseType
      State: State
      Store: StoreType
    }>,
    config?: AtomConfig<State>
  ): AtomTemplateRecursive<{
    Exports: Exports
    Params: Params
    Promise: PromiseType
    State: State
    Store: StoreType
  }>
} = <
  State = any,
  Params extends any[] = [],
  Exports extends Record<string, any> = Record<string, never>,
  StoreType extends Store<State> = Store<State>,
  PromiseType extends AtomApiPromise = undefined
>(
  key: string,
  value: AtomValueOrFactory<{
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

  return new AtomTemplate(key, value, config) as any
}
