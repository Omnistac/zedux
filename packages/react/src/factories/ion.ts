import { AtomApi } from '../classes'
import { Ion } from '../classes/atoms/Ion'
import { AtomConfig, AtomGetters, IonGet, IonSet, PromiseState } from '../types'

export const ion: {
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>
  >(
    key: string,
    value: (
      getters: AtomGetters,
      ...params: Params
    ) => AtomApi<Promise<State>, Exports>,
    config?: AtomConfig
  ): Ion<PromiseState<State>, Params, Exports>

  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>
  >(
    key: string,
    get: IonGet<State, Params, Exports>,
    config?: AtomConfig
  ): Ion<State, Params, Exports>

  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>
  >(
    key: string,
    value: (
      getters: AtomGetters,
      ...params: Params
    ) => AtomApi<Promise<State>, Exports>,
    set?: IonSet<State, Params, Exports>,
    config?: AtomConfig
  ): Ion<PromiseState<State>, Params, Exports>

  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>
  >(
    key: string,
    get: IonGet<State, Params, Exports>,
    set?: IonSet<State, Params, Exports>,
    config?: AtomConfig
  ): Ion<State, Params, Exports>
} = <
  State = any,
  Params extends any[] = [],
  Exports extends Record<string, any> = Record<string, never>
>(
  key: string,
  get: IonGet<State, Params, Exports>,
  setIn?: IonSet<State, Params, Exports> | AtomConfig,
  configIn?: AtomConfig
) => {
  const set = typeof setIn === 'function' ? setIn : undefined
  const config = configIn || (setIn as AtomConfig)

  return new Ion(key, get, set, config)
}
