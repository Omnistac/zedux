import {
  AtomConfig,
  AtomApiPromise,
  AtomValueOrFactory,
  PromiseState,
} from '../types'
import { Atom } from '../classes/atoms/Atom'
import { AtomApi } from '../classes'

export const atom: {
  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    value: (...params: Params) => AtomApi<Promise<State>, Exports, PromiseType>,
    config?: AtomConfig
  ): Atom<PromiseState<State>, Params, Exports, PromiseType>

  <
    State = any,
    Params extends any[] = [],
    Exports extends Record<string, any> = Record<string, never>,
    PromiseType extends AtomApiPromise = undefined
  >(
    key: string,
    value: AtomValueOrFactory<State, Params, Exports, PromiseType>,
    config?: AtomConfig
  ): Atom<State, Params, Exports, PromiseType>
} = <
  State = any,
  Params extends any[] = [],
  Exports extends Record<string, any> = Record<string, never>,
  PromiseType extends AtomApiPromise = undefined
>(
  key: string,
  value: AtomValueOrFactory<State, Params, Exports, PromiseType>,
  config?: AtomConfig
) => {
  if (DEV && !key) {
    throw new TypeError('Zedux: All atoms must have a key')
  }

  return new Atom<State, Params, Exports, PromiseType>(key, value, config)
}
