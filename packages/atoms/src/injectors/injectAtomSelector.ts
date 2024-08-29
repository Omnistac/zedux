import { AtomGenerics, Selectable } from '../types/index'
import { readInstance } from '../utils/evaluationContext'

export const injectAtomSelector = <
  G extends Pick<AtomGenerics, 'Params' | 'State'> = { Params: any; State: any }
>(
  selectable: Selectable<G>,
  ...args: G['Params']
): G['State'] => readInstance().e.getters.select(selectable, ...args)
