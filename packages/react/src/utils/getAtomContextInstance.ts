import { globalStore } from '../store'
import { AtomContext } from '../types'
import { instantiateAtomContext } from './instantiateAtomContext'

export const getAtomContextInstance = <T = any>(
  ecosystemId: string,
  atomContext: AtomContext<T>
) => {
  const globalState = globalStore.getState()
  const ecosystem = globalState.ecosystems[ecosystemId]

  // Try to find a provided instance on the nearest EcosystemProvider
  const ecosystemContextInstance = ecosystem.atomContexts?.get(atomContext)

  if (ecosystemContextInstance) return ecosystemContextInstance

  // Try to reuse an existing global instance
  const globalContextInstance = globalState.ecosystems.global.atomContexts?.get(
    atomContext
  )

  if (globalContextInstance) return globalContextInstance

  // No global instance has been created yet. Create one.
  return instantiateAtomContext(atomContext)
}
