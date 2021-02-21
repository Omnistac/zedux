import { globalStore } from '../store'
import { AtomContext } from '../types'
import { instantiateAtomContext } from './instantiateAtomContext'

export const getAtomContextInstance = <T = any>(
  appId: string,
  atomContext: AtomContext<T>
) => {
  const globalState = globalStore.getState()
  const appPool = globalState.pools[appId]
  const atomContexts = appPool.atomContexts

  // Try to find a provided instance on the nearest AppProvider
  const appContextInstance = atomContexts?.get(atomContext)

  if (appContextInstance) return appContextInstance

  // Try to reuse an existing global instance
  const globalContextInstance = globalState.pools.global.atomContexts?.get(
    atomContext
  )

  if (globalContextInstance) return globalContextInstance

  // No global instance has been created yet. Create one.
  return instantiateAtomContext(atomContext)
}
