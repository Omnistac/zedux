import { isZeduxStore, Store } from '@zedux/core'
import { AtomApi, StoreAtomApi } from '../classes/AtomApi'
import { AtomApiPromise, AtomValue } from '../types'
import { is } from '../utils'

export const api: {
  <
    State = any,
    Exports extends Record<string, any> = Record<string, any>,
    PromiseType extends AtomApiPromise = undefined
  >(
    value: Store<State> | StoreAtomApi<Store<State>, Exports, PromiseType>
  ): StoreAtomApi<Store<State>, Exports, PromiseType>
  <
    State = undefined,
    Exports extends Record<string, any> = Record<string, any>,
    PromiseType extends AtomApiPromise = undefined
  >(
    value: AtomValue<State> | AtomApi<State, Exports, PromiseType>
  ): AtomApi<State, Exports, PromiseType>
  <
    State = undefined,
    Exports extends Record<string, any> = Record<string, any>,
    PromiseType extends AtomApiPromise = undefined
  >(): AtomApi<State, Exports, PromiseType>
} = <
  State = undefined,
  Exports extends Record<string, any> = Record<string, any>,
  PromiseType extends AtomApiPromise = undefined
>(
  value?: AtomValue<State> | AtomApi<State, Exports, PromiseType>
) =>
  isZeduxStore(value) || is(value, StoreAtomApi)
    ? new StoreAtomApi(
        value as Store<State> | StoreAtomApi<Store<State>, Exports, PromiseType>
      )
    : (new AtomApi(
        value as AtomValue<State> | AtomApi<State, Exports, PromiseType>
      ) as any)
