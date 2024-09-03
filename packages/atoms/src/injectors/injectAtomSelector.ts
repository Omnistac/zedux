import { Selectable, SelectorGenerics } from '../types/index'
import { readInstance } from '../utils/evaluationContext'

export const injectAtomSelector = <
  G extends SelectorGenerics = {
    Params: any
    State: any
    Template: any
  }
>(
  selectable: Selectable<G>,
  ...args: G['Params']
): G['State'] => readInstance().e.live.select(selectable, ...args)
