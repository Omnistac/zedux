import { AtomConfig, AtomValueOrFactory } from '../types'
import { Atom } from '../classes/atoms/Atom'

export const atom: {
  // <State, Params extends any[], Exports extends Record<string, any>>(
  //   key: string,
  //   value: Atom<State, Params, Exports>['value'] | undefined,
  //   config: AtomConfig & { readonly: true }
  // ): ReadonlyAtom<State, Params, Exports>
  <State, Params extends any[], Exports extends Record<string, any>>(
    key: string,
    value: AtomValueOrFactory<State, Params>,
    config?: AtomConfig
  ): Atom<State, Params, Exports>
} = <State, Params extends any[], Exports extends Record<string, any>>(
  key: string,
  value: AtomValueOrFactory<State, Params>,
  config?: AtomConfig
) => {
  if (!key) {
    throw new TypeError('Zedux - All atoms must have a key')
  }

  return new Atom<State, Params, Exports>(key, value, config)
}
