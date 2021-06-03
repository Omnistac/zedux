import { LocalAtom } from '../classes/atoms/LocalAtom'
import { AtomValueOrFactory, LocalAtomConfig, LocalParams } from '../types'

export const localAtom: {
  <State, Params extends any[], Exports extends Record<string, any>>(
    key: string,
    value: AtomValueOrFactory<State, LocalParams<Params>, Exports>,
    config?: LocalAtomConfig
  ): LocalAtom<State, LocalParams<Params>, Exports>
  <State, Params extends any[], Exports extends Record<string, any>>(
    key: string,
    value: AtomValueOrFactory<State, [id: string, ...params: Params], Exports>,
    config?: LocalAtomConfig
  ): LocalAtom<State, [id: string, ...params: Params], Exports>
} = <State, Params extends any[], Exports extends Record<string, any>>(
  key: string,
  value: AtomValueOrFactory<State, LocalParams<Params>, Exports>,
  config?: LocalAtomConfig
) => {
  if (!key) {
    throw new TypeError('Zedux - All atoms must have a key')
  }

  return new LocalAtom<State, Params, Exports>(key, value, config)
}
