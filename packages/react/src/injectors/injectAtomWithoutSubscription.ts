import { injectMemo } from './injectMemo'
import { getAtomInstance } from '../instance-helpers/getAtomInstance'
import {
  AtomInjectorDescriptor,
  getKeyHash,
  InjectorType,
  split,
} from '../utils'
import { diContext } from '../utils/csContexts'
import { AtomBaseProperties, AtomInstanceBase, AtomType } from '../types'

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
  InstanceType extends AtomInstanceBase<State, Params> = AtomInstanceBase<
    State,
    Params
  >
>(
  atom: AtomBaseProperties<State, Params, InstanceType>,
  params: Params
) => {
  const { appId } = diContext.consume()
  const keyHash = injectMemo(
    () => getKeyHash(appId, atom, params),
    atom.type === AtomType.Local ? [appId, atom] : [appId, atom, params]
  )

  // NOTE: We don't want to re-run when params change - the array could change every time
  // Calculate the full key from the params and use that to determine when items in the params list change.
  const atomInstance = injectMemo(
    () => getAtomInstance(appId, atom, keyHash, params),
    [appId, atom, keyHash] // TODO: Changing the atom is _probably_ not supported. Maybe. Mmmm maybe.
  )

  split<AtomInjectorDescriptor>(
    'injectAtomWithoutSubscription',
    InjectorType.Atom,
    () => ({
      type: InjectorType.Atom,
      instanceId: atomInstance.internals.keyHash,
    }),
    prevDescriptor => {
      prevDescriptor.instanceId = atomInstance.internals.keyHash
      return prevDescriptor
    }
  )

  return atomInstance
}
