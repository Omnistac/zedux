import { readInstance } from '../classes/EvaluationStack'
import { Selectable } from '../types'

export const injectAtomSelector = <T, Args extends any[]>(
  selectable: Selectable<T, Args>,
  ...args: Args
): T => {
  const instance = readInstance()

  return instance.ecosystem._evaluationStack.atomGetters.select(
    selectable,
    ...args
  )
}
