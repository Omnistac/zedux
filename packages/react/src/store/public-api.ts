import { ecosystem } from '../factories/ecosystem'
import { AtomBaseProperties, AtomInstanceBase } from '../types'
import { globalStore, wipe as wipeAction } from './'

/**
 * getAllInstances()
 *
 * Returns an object containing all current instances of the atom, optionally
 * filtered by an ecosystem id
 *
 * @param atom - Either a reference the atom object itself or the string key of
 * the atom
 *
 * @param ecosystemId - Optionally filter results by the string id of an ecosystem - use
 * "global" for the global ecosystem
 *
 * @returns {Object} - A map of instance ids to instances
 */
export const getAllInstances = <State, Params extends any[]>(
  atom: AtomBaseProperties<State, Params> | string,
  ecosystemId = 'global'
) => {
  const atomKey = typeof atom === 'string' ? atom : atom.key
  const globalState = globalStore.getState()
  const hash: Record<string, AtomInstanceBase<State, Params>> = {}

  Object.entries(globalState.instances).forEach(([key, instance]) => {
    const instanceAtom = globalState.atoms[instance.internals.atomInternalId]

    if (
      instanceAtom.key !== atomKey ||
      (ecosystemId && !instanceAtom.key.startsWith(ecosystemId))
    ) {
      return
    }

    hash[key] = instance
  })

  return hash
}

export const getEcosystem = (id: string) => {
  const existingEcosystem = globalStore.getState().ecosystems[id]

  return existingEcosystem || ecosystem({ id })
}

export const wipe = () => globalStore.dispatch(wipeAction())

export const zeduxStore = globalStore
