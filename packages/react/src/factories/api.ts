import { AtomApi } from '../classes/AtomApi'
import { AtomValue } from '../types'

export const api = <State = undefined>(value?: AtomValue<State>) =>
  new AtomApi(value as State)
