import { injectMemo } from './injectMemo'
import { AtomInjectorDescriptor, InjectorType, split } from '../utils'
import { diContext } from '../utils/csContexts'
import { AtomBaseProperties, AtomInstanceBase } from '../types'
import { getEcosystem } from '../store/public-api'

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
  const { ecosystemId } = diContext.consume()

  // NOTE: We don't want to re-run when params change - the array could change every time
  // Calculate the full key from the params and use that to determine when items in the params list change.
  const atomInstance = injectMemo(
    () => getEcosystem(ecosystemId).load(atom, params),
    // TODO: Changing the atom is _probably_ not supported. Maybe. Mmmm maybe.
    // TODO: params will probably change every time, making this pretty
    // inefficient if lots of params are passed (since the keyHash is
    // recalculated). Use a more stable reference for this dep.
    [ecosystemId, atom, params]
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
