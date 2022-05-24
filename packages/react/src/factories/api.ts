import { isZeduxStore, Store } from '@zedux/core'
import { AtomApi, StoreAtomApi } from '../classes/AtomApi'
import { AtomValue } from '../types'

export const api: {
  <State = any, Exports extends Record<string, any> = Record<string, any>>(
    store: Store<State>
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
  isZeduxStore(value)
    ? new StoreAtomApi(value as Store<State>)
    : (new AtomApi(value as AtomValue<State> | AtomApi<State, Exports>) as any)
