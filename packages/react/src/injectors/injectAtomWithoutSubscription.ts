import { AtomBaseProperties, Scope } from '../types'
import { getKeyHash } from '../utils'
import { diContext } from '../utils/csContexts'
import { getAtomInstance } from '../utils/getAtomInstance'
import { injectMemo } from './injectMemo'

/**
 * injectAtomWithoutSubscription
 *
 * Creates an atom instance for the passed atom based on the passed params. If
 * an instance has already been created for the passed params, reuses the
 * existing instance.
 *
 * Does **not** subscribe to the instance's store.
 *
 * This is a low-level injector that probably shouldn't be used directly. Use
 * the injectors built into atoms - e.g.
 *
 * ```ts
 * const [state, setState, store] = myAtom.injectState()
 * ```
 */
export const injectAtomWithoutSubscription = <
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  atom: AtomBaseProperties<State, Params, Methods>,
  params?: Params
) => {
  const { appId, dependencies } = diContext.consume()
  const keyHash = injectMemo(
    () => getKeyHash(atom, params),
    atom.scope === Scope.Local ? [atom] : [atom, params]
  )

  // NOTE: We don't want to re-run when params change - the array could change every time
  // Calculate the full key from the params and use that to determine when items in the params list change.
  const atomInstance = injectMemo(
    () => getAtomInstance<State, Params, Methods>(appId, atom, keyHash, params),
    [appId, atom, keyHash] // TODO: Changing the atom is _probably_ not supported. Maybe. Mmmm maybe.
  )

  dependencies[atomInstance.keyHash] = atomInstance.internalId

  return atomInstance
}
