import { AtomParamsType, AtomStateType, Selectable } from '../types/index'
import { readInstance } from '../utils/evaluationContext'

export const injectAtomSelector = <S extends Selectable>(
  selectable: S,
  ...args: AtomParamsType<S>
): AtomStateType<S> => readInstance().e.live.select(selectable, ...args)
