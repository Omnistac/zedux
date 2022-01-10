import { AtomSelectorOrConfig } from '../types'
import { diContext } from '../utils/csContexts'

export const injectAtomSelector = <T, Args extends any[]>(
  atomSelector: AtomSelectorOrConfig<T, Args>,
  ...args: Args
): T => {
  const { instance } = diContext.consume()

  return instance.select(atomSelector, ...args)
}
