import { getEcosystem } from '../store/public-api'
import { AtomContext } from '../types'
import { diContext } from '../utils/csContexts'
import { injectMemo } from './injectMemo'

export const injectAtomContext = <T = any>(context: AtomContext<T>) => {
  const { ecosystemId } = diContext.consume()
  const ecosystem = getEcosystem(ecosystemId)

  const atomContext = injectMemo(
    () => ecosystem.getAtomContextInstance(context),
    [context, ecosystem]
  )

  return atomContext
}
