import { AtomApi } from '../classes/AtomApi'
import { AtomValue } from '../types'

export const api = <
  State = undefined,
  Exports extends Record<string, any> = Record<string, any>
>(
  value?: AtomValue<State> | AtomApi<State, Exports>
) => new AtomApi(value as AtomValue<State> | AtomApi<State, Exports>)
