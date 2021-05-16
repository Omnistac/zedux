import { LocalAtom } from '../classes/atoms/LocalAtom'
import { AtomValueOrFactory, LocalAtomConfig } from '../types'

export const localAtom: {
  <State, Params extends any[], Exports extends Record<string, any>>(
    key: string,
    value: AtomValueOrFactory<State, [string | undefined, ...Params]>,
    config?: LocalAtomConfig & { readonly: true }
  ): LocalAtom<State, Params, Exports>
  <State, Params extends any[], Exports extends Record<string, any>>(
    key: string,
    value: AtomValueOrFactory<State, [string | undefined, ...Params]>,
    config?: LocalAtomConfig
  ): LocalAtom<State, Params, Exports>
} = <State, Params extends any[], Exports extends Record<string, any>>(
  key: string,
  value: AtomValueOrFactory<State, [string | undefined, ...Params]>,
  config?: LocalAtomConfig
) => {
  if (!key) {
    throw new TypeError('Zedux - All atoms must have a key')
  }

  return new LocalAtom<State, Params, Exports>(key, value, config)
}
