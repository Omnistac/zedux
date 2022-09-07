import { AtomApi } from '../classes'
import { Ion } from '../classes/atoms/Ion'
import {
  AtomConfig,
  AtomGetters,
  AtomApiPromise,
  IonGet,
  IonSet,
  PromiseState,
} from '../types'

export const ion: {
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    value: (
      getters: AtomGetters,
      ...params: Params
    ) => AtomApi<Promise<State>, Exports, PromiseType>,
    config?: AtomConfig
  ): Ion<PromiseState<State>, Params, Exports, PromiseType>

  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    get: IonGet<State, Params, Exports, PromiseType>,
    config?: AtomConfig
  ): Ion<State, Params, Exports, PromiseType>

  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    value: (
      getters: AtomGetters,
      ...params: Params
    ) => AtomApi<Promise<State>, Exports, PromiseType>,
    set?: IonSet<State, Params, Exports, PromiseType>,
    config?: AtomConfig
  ): Ion<PromiseState<State>, Params, Exports, PromiseType>

  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    get: IonGet<State, Params, Exports, PromiseType>,
    set?: IonSet<State, Params, Exports, PromiseType>,
    config?: AtomConfig
  ): Ion<State, Params, Exports, PromiseType>
} = <
  State = any,
  Params extends any[] = [],
  Exports extends Record<string, any> = Record<string, never>,
  PromiseType extends AtomApiPromise = undefined
>(
  key: string,
  get: IonGet<State, Params, Exports, PromiseType>,
  setIn?: IonSet<State, Params, Exports, PromiseType> | AtomConfig,
  configIn?: AtomConfig
) => {
  const set = typeof setIn === 'function' ? setIn : undefined
  const config = configIn || (setIn as AtomConfig)

  return new Ion(key, get, set, config)
}
