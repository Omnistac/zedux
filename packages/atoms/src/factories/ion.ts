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
  StateOf,
  EventsOf,
  None,
} from '../types/index'

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
    SignalType extends Signal<any> = Signal<any>,
    Params extends any[] = [],
    Exports extends Record<string, any> = None,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    value: (
      ecosystem: Ecosystem,
      ...params: Params
    ) =>
      | SignalType
      | AtomApi<{
          Exports: Exports
          Promise: PromiseType
          Signal: SignalType
          State: StateOf<SignalType>
        }>,
    config?: AtomConfig<StateOf<SignalType>>
  ): IonTemplateRecursive<{
    State: StateOf<SignalType>
    Params: Params
    Events: EventsOf<SignalType>
    Exports: Exports
    Promise: PromiseType
  }>

  // No Signal (TODO: Is this overload unnecessary? `atom` doesn't have it)
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = None,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    value: (
      ecosystem: Ecosystem,
      ...params: Params
    ) =>
      | AtomApi<{
          Exports: Exports
          Promise: PromiseType
          Signal: undefined
          State: State
        }>
      | State,
    config?: AtomConfig<State>
  ): IonTemplateRecursive<{
    State: State
    Params: Params
    Events: None
    Exports: Exports
    Promise: PromiseType
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
) => new IonTemplate(key, value, config) as any
