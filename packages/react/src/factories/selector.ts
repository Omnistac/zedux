import { AtomConfig, ReadonlyAtom } from '../types'
import { atom } from './atom'

export const selector = <
  State,
  Params extends any[],
  Exports extends Record<string, any>
>(
  key: string,
  value: ReadonlyAtom<State, Params, Exports>['value'],
  config?: AtomConfig
) => atom(key, value, { readonly: true, ttl: 0, ...config })
