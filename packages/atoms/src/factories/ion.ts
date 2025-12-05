import {
  IonTemplate,
  IonTemplateRecursive,
} from '../classes/templates/IonTemplate'
import { AtomApi } from '../classes/AtomApi'
import { Ecosystem } from '../classes/Ecosystem'
import { Signal } from '../classes/Signal'
import {
  AtomConfig,
  AtomApiPromise,
  IonStateFactory,
  PromiseState,
  None,
} from '../types/index'

/**
 * Creates an atom template that's specifically geared toward derivations:
 *
 * - The first parameter of the state factory will be the `ecosystem`, so you
 *   can easily `get(otherAtom)`
 * - The atom's `ttl` will be set to `0` by default, destroying instances of
 *   this atom as soon as they're no longer used.
 */
export const ion: {
  // Query Atoms
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = None
  >(
    key: string,
    value: (
      ecosystem: Ecosystem,
      ...params: Params
    ) => AtomApi<{
      Exports: Exports
      Promise: any
      Signal: undefined
      State: Promise<State>
    }>,
    config?: AtomConfig<State>
  ): IonTemplateRecursive<{
    State: PromiseState<State>
    Params: Params
    Events: None
    Exports: Exports
    Promise: Promise<State>
  }>

  // Signals
  <
    StateType,
    EventsType extends Record<string, any> = None,
    Params extends any[] = [],
    Exports extends Record<string, any> = None,
    PromiseType extends AtomApiPromise = undefined,
    ResolvedState = StateType
  >(
    key: string,
    value: (
      ecosystem: Ecosystem,
      ...params: Params
    ) =>
      | Signal<{
          Events: EventsType
          Params: any
          State: StateType
          Template: any
        }>
      | AtomApi<{
          Exports: Exports
          Promise: PromiseType
          Signal: Signal<{
            Events: EventsType
            Params: any
            State: StateType
            Template: any
          }>
          State: StateType
        }>
      | Signal<{
          Events: EventsType
          Params: any
          ResolvedState: ResolvedState
          State: StateType
          Template: any
        }>
      | AtomApi<{
          Exports: Exports
          Promise: PromiseType
          Signal: Signal<{
            Events: EventsType
            Params: any
            ResolvedState: ResolvedState
            State: StateType
            Template: any
          }>
          State: StateType
        }>,
    config?: AtomConfig<StateType>
  ): IonTemplateRecursive<{
    State: StateType
    Params: Params
    Events: EventsType
    Exports: Exports
    Promise: PromiseType
    ResolvedState: ResolvedState
  }>

  // Catch-all
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = None,
    EventsType extends Record<string, any> = None,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    value: IonStateFactory<{
      State: State
      Params: Params
      Events: EventsType
      Exports: Exports
      Promise: PromiseType
    }>,
    config?: AtomConfig<State>
  ): IonTemplateRecursive<{
    State: State
    Params: Params
    Events: EventsType
    Exports: Exports
    Promise: PromiseType
  }>
} = <
  State = any,
  Params extends any[] = [],
  Exports extends Record<string, any> = None,
  EventsType extends Record<string, any> = None,
  PromiseType extends AtomApiPromise = undefined
>(
  key: string,
  value: IonStateFactory<{
    State: State
    Params: Params
    Events: EventsType
    Exports: Exports
    Promise: PromiseType
  }>,
  config?: AtomConfig<State>
) => new IonTemplate(key, value, config)
