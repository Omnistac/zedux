import { isZeduxStore, Store } from '@zedux/core'
import { AtomApi, StoreAtomApi } from '../classes/AtomApi'
import { AtomValue } from '../types'
import { is } from '../utils'

export const api: {
  <State = any, Exports extends Record<string, any> = Record<string, any>>(
    value: Store<State> | StoreAtomApi<Store<State>, Exports>
  ): StoreAtomApi<Store<State>, Exports>
  <
    State = undefined,
    Exports extends Record<string, any> = Record<string, any>
  >(
    value?: AtomValue<State> | AtomApi<State, Exports>
  ): AtomApi<State, Exports>
} = <
  State = undefined,
  Exports extends Record<string, any> = Record<string, any>
>(
  value?: AtomValue<State> | AtomApi<State, Exports>
) =>
  isZeduxStore(value) || is(value, StoreAtomApi)
    ? new StoreAtomApi(
        value as Store<State> | StoreAtomApi<Store<State>, Exports>
      )
    : (new AtomApi(value as AtomValue<State> | AtomApi<State, Exports>) as any)
