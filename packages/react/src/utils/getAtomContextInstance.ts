import { globalStore } from '../store'
import { AtomContext } from '../types'
import { instantiateAtomContext } from './instantiateAtomContext'

export const getAtomContextInstance = <T = any>(
  appId: string,
  atomContext: AtomContext<T>
) => {
  const globalState = globalStore.getState()
  const appPool = globalState.ecosystems[appId]

  // Try to find a provided instance on the nearest AppProvider
  const appContextInstance = appPool.atomContexts?.get(atomContext)

  if (appContextInstance) return appContextInstance

  // Try to reuse an existing global instance
  const globalContextInstance = globalState.ecosystems.global.atomContexts?.get(
    atomContext
  )

  if (globalContextInstance) return globalContextInstance

  // No global instance has been created yet. Create one.
  return instantiateAtomContext(atomContext)
}
