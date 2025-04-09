import { AtomApi } from '../classes/AtomApi'
import { AtomApiPromise, None, ResolvedStateOf, StateOf } from '../types/index'
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
 *     initial evaluation (and ignored on all subsequent evaluations).
 *   - If promise or state references change on subsequent evaluations, it
 *     triggers the appropriate updates in all the atom's dynamic observers.
 *     Promise reference changes also notify static observers.
 */
export const api: {
  // Signals (AtomApi cloning)
  <
    SignalType extends Signal<any> = Signal<any>,
    Exports extends Record<string, any> = None,
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
    Exports: None
    Promise: undefined
    ResolvedState: ResolvedStateOf<SignalType>
    Signal: SignalType
    State: StateOf<SignalType>
  }>

  // No Value
  (): AtomApi<{
    Exports: None
    Promise: undefined
    Signal: undefined
    State: undefined
  }>

  // No Value (passing generics manually)
  <
    State = undefined,
    Exports extends Record<string, any> = None,
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
    Exports extends Record<string, any> = None,
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
    Exports extends Record<string, any> = None,
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
  Exports extends Record<string, any> = None,
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
          ResolvedState: State
          Signal: SignalType
          State: State
        }>
      | State
  )
