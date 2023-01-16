import { readInstance } from '../classes/EvaluationStack'
import { AtomSelectorOrConfig } from '../types'

export const injectAtomSelector = <T, Args extends any[]>(
  atomSelector: AtomSelectorOrConfig<T, Args>,
  ...args: Args
): T => {
  const instance = readInstance()

  return instance.ecosystem._evaluationStack.atomGetters.select(
    atomSelector,
    ...args
  )
}
