import { Store, StoreStateType } from '@zedux/core'
import {
  AtomConfig,
  AtomApiPromise,
  AtomValueOrFactory,
  PromiseState,
} from '../types'
import { Atom } from '../classes/atoms/Atom'
import { AtomApi } from '../classes'

export const atom: {
  // Query Atoms
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>
  >(
    key: string,
    value: (
      ...params: Params
    ) => AtomApi<Promise<State>, Exports, undefined, any>,
    config?: AtomConfig<State>
  ): Atom<{
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
    value: (
      ...params: Params
    ) =>
      | StoreType
      | AtomApi<StoreStateType<Store>, Exports, StoreType, PromiseType>,
    config?: AtomConfig<StoreStateType<StoreType>>
  ): Atom<{
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
  ): Atom<{
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

  return new Atom<{
    State: State
    Params: Params
    Exports: Exports
    Store: StoreType
    Promise: PromiseType
  }>(key, value, config)
}
