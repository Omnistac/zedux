import { AtomBaseProperties, AtomInstanceBase } from '../types'
import { globalStore, wipe as wipeAction } from './'

/**
 * getAllInstances()
 *
 * Returns an object containing all current instances of the atom, optionally
 * filtered by an app id
 *
 * @param atom - Either a reference the atom object itself or the string key of
 * the atom
 *
 * @param appId - Optionally filter results by the string id of an app - use
 * "global" for the global ecosystem
 *
 * @returns {Object} - A map of instance ids to instances
 */
export const getAllInstances = <State, Params extends any[]>(
  atom: AtomBaseProperties<State, Params> | string,
  appId = 'global'
) => {
  const atomKey = typeof atom === 'string' ? atom : atom.key
  const globalState = globalStore.getState()
  const hash: Record<string, AtomInstanceBase<State, Params>> = {}

  Object.entries(globalState.instances).forEach(([key, instance]) => {
    const instanceAtom = globalState.atoms[instance.internals.atomInternalId]

    if (
      instanceAtom.key !== atomKey ||
      (appId && !instanceAtom.key.startsWith(appId))
    ) {
      return
    }

    hash[key] = instance
  })

  return hash
}

export const wipe = () => globalStore.dispatch(wipeAction())
