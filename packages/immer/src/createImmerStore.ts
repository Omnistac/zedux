import { ImmerStore } from './ImmerStore'

export const createImmerStore = <State>(initialState?: State) =>
  new ImmerStore<State>(initialState)
