import { LocalAtom } from '../classes/atoms/LocalAtom'
import { AtomConfig, AtomValueOrFactory } from '../types'

export const localAtom: {
  <
    State,
    Params extends [id?: string | undefined, ...rest: any[]],
    Exports extends Record<string, any>
  >(
    key: string,
    value: AtomValueOrFactory<State, Params, Exports>,
    config?: AtomConfig
  ): LocalAtom<State, Params, Exports>
  <
    State,
    Params extends [id?: string | undefined, ...rest: any[]],
    Exports extends Record<string, any>
  >(
    key: string,
    value: AtomValueOrFactory<State, Params, Exports>,
    config?: AtomConfig
  ): LocalAtom<State, Params, Exports>
} = <
  State,
  Params extends [id?: string | undefined, ...rest: any[]],
  Exports extends Record<string, any>
>(
  key: string,
  value: AtomValueOrFactory<State, Params, Exports>,
  config?: AtomConfig
) => {
  if (!key) {
    throw new TypeError('Zedux - All atoms must have a key')
  }

  return new LocalAtom<State, Params, Exports>(key, value, config)
}
