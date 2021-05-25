import { Ion } from '../classes/atoms/Ion'
import { AtomConfig, IonGet, IonSet } from '../types'

export const ion: {
  <State, Params extends any[], Exports extends Record<string, any>>(
    key: string,
    get: IonGet<State, Params, Exports>,
    config?: AtomConfig
  ): Ion<State, Params, Exports>
  <State, Params extends any[], Exports extends Record<string, any>>(
    key: string,
    get: IonGet<State, Params, Exports>,
    set?: IonSet<State, Params, Exports>,
    config?: AtomConfig
  ): Ion<State, Params, Exports>
} = <State, Params extends any[], Exports extends Record<string, any>>(
  key: string,
  get: IonGet<State, Params, Exports>,
  setIn?: IonSet<State, Params, Exports> | AtomConfig,
  configIn?: AtomConfig
) => {
  const set = typeof setIn === 'function' ? setIn : undefined
  const config = configIn || (setIn as AtomConfig)

  return new Ion(key, get, set, config)
}
