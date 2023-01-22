import { Store, StoreStateType } from '@zedux/core'
import { AtomApi } from '../classes/AtomApi'
import { AtomApiPromise } from '../types'

export const api: {
  // Custom Stores
  <
    StoreType extends Store<any> = Store<any>,
    Exports extends Record<string, any> = Record<string, any>,
    PromiseType extends AtomApiPromise = undefined
  >(
    value:
      | StoreType
      | AtomApi<StoreStateType<StoreType>, Exports, StoreType, PromiseType>
  ): AtomApi<StoreStateType<StoreType>, Exports, StoreType, PromiseType>

  // No Value
  <
    State = undefined,
    Exports extends Record<string, any> = Record<string, any>,
    PromiseType extends AtomApiPromise = undefined
  >(): AtomApi<State, Exports, undefined, PromiseType>

  // No Store
  <
    State = undefined,
    Exports extends Record<string, any> = Record<string, any>,
    PromiseType extends AtomApiPromise = undefined
  >(
    value: State | AtomApi<State, Exports, undefined, PromiseType>
  ): AtomApi<State, Exports, undefined, PromiseType>

  // Catch-all
  <
    State = undefined,
    Exports extends Record<string, any> = Record<string, any>,
    StoreType extends Store<State> = Store<State>,
    PromiseType extends AtomApiPromise = undefined
  >(
    value: State | StoreType | AtomApi<State, Exports, StoreType, PromiseType>
  ): AtomApi<State, Exports, StoreType, PromiseType>
} = <
  State = undefined,
  Exports extends Record<string, any> = Record<string, any>,
  StoreType extends Store<State> | undefined = undefined,
  PromiseType extends AtomApiPromise = undefined
>(
  value?: AtomApi<State, Exports, StoreType, PromiseType> | StoreType | State
) =>
  new AtomApi(
    value as AtomApi<State, Exports, StoreType, PromiseType> | StoreType | State
  )
