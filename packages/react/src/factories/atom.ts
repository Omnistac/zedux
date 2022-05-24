import { AtomConfig, AtomValueOrFactory, PromiseState } from '../types'
import { Atom } from '../classes/atoms/Atom'
import { AtomApi } from '../classes'

export const atom: {
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>
  >(
    key: string,
    value: (...params: Params) => AtomApi<Promise<State>, Exports>,
    config?: AtomConfig
  ): Atom<PromiseState<State>, Params, Exports>

  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>
  >(
    key: string,
    value: AtomValueOrFactory<State, Params, Exports>,
    config?: AtomConfig
  ): Atom<State, Params, Exports>
} = <
  State = any,
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
