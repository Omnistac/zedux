import { AtomApiPromise } from '@zedux/atoms'
import { Store, StoreStateType } from '@zedux/core'
import { StoreAtomApi } from './StoreAtomApi'

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
 *     triggers the appropriate updates in all the atom's dynamic observers.
 *     Promise reference changes also notify static observers.
 */
export const storeApi: {
  // Custom Stores (AtomApi cloning)
  <
    StoreType extends Store<any> = Store<any>,
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(
    value: StoreAtomApi<{
      Exports: Exports
      Promise: PromiseType
      State: StoreStateType<StoreType>
      Store: StoreType
    }>
  ): StoreAtomApi<{
    Exports: Exports
    Promise: PromiseType
    State: StoreStateType<StoreType>
    Store: StoreType
  }>

  // Custom Stores (normal)
  <StoreType extends Store<any> = Store<any>>(value: StoreType): StoreAtomApi<{
    Exports: Record<string, never>
    Promise: undefined
    State: StoreStateType<StoreType>
    Store: StoreType
  }>

  // No Value
  (): StoreAtomApi<{
    Exports: Record<string, never>
    Promise: undefined
    State: undefined
    Store: undefined
  }>

  <
    State = undefined,
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(): StoreAtomApi<{
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
    value: StoreAtomApi<{
      Exports: Exports
      Promise: PromiseType
      State: State
      Store: undefined
    }>
  ): StoreAtomApi<{
    Exports: Exports
    Promise: PromiseType
    State: State
    Store: undefined
  }>

  // No Store (normal)
  <State = undefined>(value: State): StoreAtomApi<{
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
      | StoreAtomApi<{
          Exports: Exports
          Promise: PromiseType
          State: State
          Store: StoreType
        }>
  ): StoreAtomApi<{
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
    | StoreAtomApi<{
        Exports: Exports
        Promise: PromiseType
        State: State
        Store: StoreType
      }>
    | StoreType
    | State
) =>
  new StoreAtomApi(
    value as
      | StoreAtomApi<{
          Exports: Exports
          Promise: PromiseType
          State: State
          Store: StoreType
        }>
      | StoreType
      | State
  )
