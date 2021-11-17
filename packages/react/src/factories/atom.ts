import { AtomConfig, AtomValueOrFactory } from '../types'
import { Atom } from '../classes/atoms/Atom'

export const atom = <
  State,
  Params extends any[] = [],
  Exports extends Record<string, any> = Record<string, never>
>(
  key: string,
  value: AtomValueOrFactory<State, Params, Exports>,
  config?: AtomConfig
) => {
  if (!key) {
    throw new TypeError('Zedux: All atoms must have a key')
  }

  return new Atom<State, Params, Exports>(key, value, config)
}
