import { useContext, useMemo } from 'react'
import { appContext } from '../components/AppProvider'
import { getAtomInstance } from '../instance-helpers/getAtomInstance'
import { AtomBaseProperties, AtomInstanceBase, AtomType } from '../types'
import { getKeyHash } from '../utils'

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
  const appId = useContext(appContext)

  const keyHash = useMemo(
    () => getKeyHash(appId, atom, params),
    atom.type === AtomType.Local ? [appId, atom] : [appId, atom, params]
  )

  // NOTE: We don't want to re-run when params change - the array could change every time
  // Calculate the full key from the params and use that to determine when items in the params list change.
  const atomInstance = useMemo(
    () => getAtomInstance(appId, atom, keyHash, params),
    [appId, atom, keyHash] // TODO: Changing the atom is _probably_ not supported. Maybe. Mmmm maybe.
  )

  return atomInstance
}
