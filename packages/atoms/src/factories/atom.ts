import {
  AtomConfig,
  AtomApiPromise,
  AtomValueOrFactory,
  PromiseState,
  None,
} from '../types/index'
import {
  AtomTemplate,
  AtomTemplateRecursive,
} from '../classes/templates/AtomTemplate'
import { AtomApi } from '../classes/AtomApi'
import { Signal } from '../classes/Signal'

export const atom: {
  // Query Atoms
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = None
  >(
    key: string,
    value: (...params: Params) => AtomApi<{
      Exports: Exports
      Promise: any
      Signal: undefined
      State: Promise<State>
    }>,
    config?: AtomConfig<State>
  ): AtomTemplateRecursive<{
    State: PromiseState<State>
    Params: Params
    Events: None // TODO: give query atoms unique events
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
    value: (...params: Params) =>
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
  ): AtomTemplateRecursive<{
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
    Events extends Record<string, any> = None,
    SignalType extends
      | Signal<{ Events: Events; Params: any; State: State; Template: any }>
      | undefined = undefined,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    value: AtomValueOrFactory<{
      Exports: Exports
      Params: Params
      Promise: PromiseType
      Signal: SignalType
      State: State
    }>,
    config?: AtomConfig<State>
  ): AtomTemplateRecursive<{
    Events: Events
    Exports: Exports
    Params: Params
    Promise: PromiseType
    State: State
  }>
} = <
  State = any,
  Params extends any[] = [],
  Exports extends Record<string, any> = None,
  Events extends Record<string, any> = None,
  SignalType extends
    | Signal<{ Events: Events; Params: any; State: State; Template: any }>
    | undefined = undefined,
  PromiseType extends AtomApiPromise = undefined
>(
  key: string,
  value: AtomValueOrFactory<{
    Exports: Exports
    Params: Params
    Promise: PromiseType
    Signal: SignalType
    State: State
  }>,
  config?: AtomConfig<State>
) => {
  if (DEV && !key) {
    throw new TypeError('Zedux: All atoms must have a key')
  }

  return new AtomTemplate(key, value, config)
}
