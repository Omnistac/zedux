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
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    value: (
      ...params: Params
    ) => AtomApi<Promise<State>, Exports, undefined, PromiseType>,
    config?: AtomConfig<State>
  ): Atom<
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
    value: (
      ...params: Params
    ) =>
      | StoreType
      | AtomApi<StoreStateType<Store>, Exports, StoreType, PromiseType>,
    config?: AtomConfig<StoreStateType<StoreType>>
  ): Atom<StoreStateType<StoreType>, Params, Exports, StoreType, PromiseType>

  // Catch-all
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>,
    StoreType extends Store<State> = Store<State>,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    value: AtomValueOrFactory<State, Params, Exports, StoreType, PromiseType>,
    config?: AtomConfig<State>
  ): Atom<State, Params, Exports, StoreType, PromiseType>
} = <
  State = any,
  Params extends any[] = [],
  Exports extends Record<string, any> = Record<string, never>,
  StoreType extends Store<State> = Store<State>,
  PromiseType extends AtomApiPromise = undefined
>(
  key: string,
  value: AtomValueOrFactory<State, Params, Exports, StoreType, PromiseType>,
  config?: AtomConfig<State>
) => {
  if (DEV && !key) {
    throw new TypeError('Zedux: All atoms must have a key')
  }

  return new Atom<State, Params, Exports, StoreType, PromiseType>(
    key,
    value,
    config
  )
}
