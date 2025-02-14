import {
  AtomConfig,
  AtomApiPromise,
  AtomValueOrFactory,
  PromiseState,
  StateOf,
  EventsOf,
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
    Exports extends Record<string, any> = Record<string, never>
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
    SignalType extends Signal<any> = Signal<any>,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    value: (...params: Params) =>
      | SignalType
      | AtomApi<{
          Exports: Exports
          Promise: PromiseType
          Signal: SignalType
          State: StateOf<SignalType>
        }>,
    config?: AtomConfig<StateOf<SignalType>>
  ): AtomTemplateRecursive<{
    State: StateOf<SignalType>
    Params: Params
    Events: EventsOf<SignalType>
    Exports: Exports
    Promise: PromiseType
  }>

  // Catch-all
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>,
    Events extends Record<string, any> = None,
    SignalType extends
      | Signal<{ State: State; Events: Events }>
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
  Exports extends Record<string, any> = Record<string, never>,
  Events extends Record<string, any> = None,
  SignalType extends
    | Signal<{ State: State; Events: Events }>
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
