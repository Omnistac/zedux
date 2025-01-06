import { ParamsOf, Selectable, StateOf } from '../types/index'
import { readInstance } from '../utils/evaluationContext'

export const injectAtomSelector = <S extends Selectable>(
  selectable: S,
  ...args: ParamsOf<S>
): StateOf<S> => readInstance().e.live.select(selectable, ...args)
