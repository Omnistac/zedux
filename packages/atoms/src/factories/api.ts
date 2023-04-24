import { Store, StoreStateType } from '@zedux/core'
import { AtomApi } from '../classes/AtomApi'
import { AtomApiPromise } from '../types/index'

/**
 * Create an AtomApi
 *
 * AtomApis are the standard mechanism for passing stores, exports, and promises
 * around.
 *
 * An AtomApi that's returned from an atom state factory becomes _the_ api of
 * the atom.
 *
 *   - Any exports on the AtomApi are set as the atom instance's exports on
 *     initial evaluation and ignored forever after.
 *   - If promise or state references change on subsequent evaluations, it
 *     triggers the appropriate updates in all the atom's dynamic dependents.
 */
export const api: {
  // Custom Stores (AtomApi cloning)
  <
    StoreType extends Store<any> = Store<any>,
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(
    value: AtomApi<{
      Exports: Exports
      Promise: PromiseType
      State: StoreStateType<StoreType>
      Store: StoreType
    }>
  ): AtomApi<{
    Exports: Exports
    Promise: PromiseType
    State: StoreStateType<StoreType>
    Store: StoreType
  }>

  // Custom Stores (normal)
  <StoreType extends Store<any> = Store<any>>(value: StoreType): AtomApi<{
    Exports: Record<string, never>
    Promise: undefined
    State: StoreStateType<StoreType>
    Store: StoreType
  }>

  // No Value
  (): AtomApi<{
    Exports: Record<string, never>
    Promise: undefined
    State: undefined
    Store: undefined
  }>

  <
    State = undefined,
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(): AtomApi<{
    Exports: Exports
    Promise: PromiseType
    State: State
    Store: undefined
  }>

  // No Store (AtomApi cloning)
  <
    State = undefined,
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(
    value: AtomApi<{
      Exports: Exports
      Promise: PromiseType
      State: State
      Store: undefined
    }>
  ): AtomApi<{
    Exports: Exports
    Promise: PromiseType
    State: State
    Store: undefined
  }>

  // No Store (normal)
  <State = undefined>(value: State): AtomApi<{
    Exports: Record<string, never>
    Promise: undefined
    State: State
    Store: undefined
  }>

  // Catch-all
  <
    State = undefined,
    Exports extends Record<string, any> = Record<string, never>,
    StoreType extends Store<State> = Store<State>,
    PromiseType extends AtomApiPromise = undefined
  >(
    value:
      | State
      | StoreType
      | AtomApi<{
          Exports: Exports
          Promise: PromiseType
          State: State
          Store: StoreType
        }>
  ): AtomApi<{
    Exports: Exports
    Promise: PromiseType
    State: State
    Store: StoreType
  }>
} = <
  State = undefined,
  Exports extends Record<string, any> = Record<string, never>,
  StoreType extends Store<State> | undefined = undefined,
  PromiseType extends AtomApiPromise = undefined
>(
  value?:
    | AtomApi<{
        Exports: Exports
        Promise: PromiseType
        State: State
        Store: StoreType
      }>
    | StoreType
    | State
) =>
  new AtomApi(
    value as
      | AtomApi<{
          Exports: Exports
          Promise: PromiseType
          State: State
          Store: StoreType
        }>
      | StoreType
      | State
  )
