import { Store, StoreStateType } from '@zedux/core'
import { AtomApi } from '../classes/AtomApi'
import { AtomApiPromise } from '../types'

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
    value: AtomApi<StoreStateType<StoreType>, Exports, StoreType, PromiseType>,
    wrap?: boolean
  ): AtomApi<StoreStateType<StoreType>, Exports, StoreType, PromiseType>

  // Custom Stores (normal)
  <StoreType extends Store<any> = Store<any>>(
    value: StoreType,
    wrap?: boolean
  ): AtomApi<
    StoreStateType<StoreType>,
    Record<string, never>,
    StoreType,
    undefined
  >

  // No Value
  (): AtomApi<undefined, Record<string, never>, undefined, undefined>

  <
    State = undefined,
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(): AtomApi<State, Exports, undefined, PromiseType>

  // No Store (AtomApi cloning)
  <
    State = undefined,
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(
    value: AtomApi<State, Exports, undefined, PromiseType>,
    wrap?: boolean
  ): AtomApi<State, Exports, undefined, PromiseType>

  // No Store (normal)
  <State = undefined>(value: State, wrap?: boolean): AtomApi<
    State,
    Record<string, never>,
    undefined,
    undefined
  >

  // Catch-all
  <
    State = undefined,
    Exports extends Record<string, any> = Record<string, never>,
    StoreType extends Store<State> = Store<State>,
    PromiseType extends AtomApiPromise = undefined
  >(
    value: State | StoreType | AtomApi<State, Exports, StoreType, PromiseType>,
    wrap?: boolean
  ): AtomApi<State, Exports, StoreType, PromiseType>
} = <
  State = undefined,
  Exports extends Record<string, any> = Record<string, never>,
  StoreType extends Store<State> | undefined = undefined,
  PromiseType extends AtomApiPromise = undefined
>(
  value?: AtomApi<State, Exports, StoreType, PromiseType> | StoreType | State,
  wrap?: boolean
) =>
  new AtomApi(
    value as
      | AtomApi<State, Exports, StoreType, PromiseType>
      | StoreType
      | State,
    wrap
  )
