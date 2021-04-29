import { useContext, useMemo } from 'react'
import { ecosystemContext } from '../classes/Ecosystem'
import { getEcosystem } from '../store/public-api'
import { AtomBaseProperties, AtomInstanceBase } from '../types'

/**
 * useAtomWithoutSubscription
 *
 * Creates an atom instance for the passed atom based on the passed params. If
 * an instance has already been created for the passed params, reuses the
 * existing instance.
 *
 * Does **not** subscribe to the instance's store.
 *
 * This is a low-level hook that probably shouldn't be used directly. Use the
 * hooks built into atoms - e.g.
 *
 * ```ts
 * const [state, setState] = myAtom.useState()
 * ```
 *
 * @param atom The atom to instantiate (or reuse an instantiation of)
 * @param params The params to pass the atom and calculate its keyHash
 */
export const useAtomWithoutSubscription = <
  State,
  Params extends any[],
  InstanceType extends AtomInstanceBase<State, Params>
>(
  atom: AtomBaseProperties<State, Params, InstanceType>,
  params: Params
) => {
  const ecosystemId = useContext(ecosystemContext)

  // NOTE: We don't want to re-run when params change - the array could change every time
  // Calculate the full key from the params and use that to determine when items in the params list change.
  const atomInstance = useMemo(
    () => getEcosystem(ecosystemId).load(atom, params),
    // TODO: Changing the atom is _probably_ not supported. Maybe. Mmmm maybe.
    // TODO: params will probably change every time, making this pretty
    // inefficient if lots of params are passed (since the keyHash is
    // recalculated). Use a more stable reference for this dep.
    [ecosystemId, atom, params]
  )

  return atomInstance
}
