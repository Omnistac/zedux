import { AtomApi } from '../classes/AtomApi'
import { AtomApiPromise, StateOf } from '../types/index'
import { Signal } from '../classes/Signal'

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
  // Signals (AtomApi cloning)
  <
    SignalType extends Signal<any> = Signal<any>,
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(
    value: AtomApi<{
      Exports: Exports
      Promise: PromiseType
      Signal: SignalType
      State: StateOf<SignalType>
    }>
  ): AtomApi<{
    Exports: Exports
    Promise: PromiseType
    Signal: SignalType
    State: StateOf<SignalType>
  }>

  // Signals (normal)
  <SignalType extends Signal<any> = Signal<any>>(value: SignalType): AtomApi<{
    Exports: Record<string, never>
    Promise: undefined
    Signal: SignalType
    State: StateOf<SignalType>
  }>

  // No Value
  (): AtomApi<{
    Exports: Record<string, never>
    Promise: undefined
    Signal: undefined
    State: undefined
  }>

  // No Value (passing generics manually)
  <
    State = undefined,
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(): AtomApi<{
    Exports: Exports
    Promise: PromiseType
    Signal: undefined
    State: State
  }>

  // No Signal (AtomApi cloning)
  <
    State = undefined,
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(
    value: AtomApi<{
      Exports: Exports
      Promise: PromiseType
      Signal: undefined
      State: State
    }>
  ): AtomApi<{
    Exports: Exports
    Promise: PromiseType
    Signal: undefined
    State: State
  }>

  // Normal Value
  <
    State = undefined,
    Exports extends Record<string, any> = Record<string, never>,
    SignalType extends
      | Signal<{ Events: any; State: State }>
      | undefined = undefined
  >(
    value: State
  ): AtomApi<{
    Exports: Exports
    Promise: undefined
    Signal: SignalType
    State: State
  }>
} = <
  State = undefined,
  Exports extends Record<string, any> = Record<string, never>,
  SignalType extends
    | Signal<{ Events: any; State: State }>
    | undefined = undefined,
  PromiseType extends AtomApiPromise = undefined
>(
  value?:
    | AtomApi<{
        Exports: Exports
        Promise: PromiseType
        Signal: SignalType
        State: State
      }>
    | State
) =>
  new AtomApi(
    value as
      | AtomApi<{
          Exports: Exports
          Promise: PromiseType
          Signal: SignalType
          State: State
        }>
      | State
  )
