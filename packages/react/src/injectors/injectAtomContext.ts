import { AtomContext } from '../types'
import { diContext } from '../utils/csContexts'
import { getAtomContextInstance } from '../utils/getAtomContextInstance'
import { injectMemo } from './injectMemo'

export const injectAtomContext = <T = any>(context: AtomContext<T>) => {
  const { appId } = diContext.consume()

  const atomContext = injectMemo(() => getAtomContextInstance(appId, context), [
    context,
  ])

  return atomContext
}
