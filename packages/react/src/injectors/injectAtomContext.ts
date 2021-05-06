import { AtomContext } from '../types'
import { injectEcosystem } from './injectEcosystem'
import { injectMemo } from './injectMemo'

export const injectAtomContext = <T = any>(context: AtomContext<T>) => {
  const ecosystem = injectEcosystem()

  const atomContext = injectMemo(
    () => ecosystem.getAtomContextInstance(context),
    [context, ecosystem]
  )

  return atomContext
}
