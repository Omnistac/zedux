import {
  AtomInjectorDescriptor,
  haveDepsChanged,
  InjectorType,
  split,
} from '../utils'
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
  const { ecosystemId, keyHash } = diContext.consume()
  const ecosystem = getEcosystem(ecosystemId)

  const { instance } = split<AtomInjectorDescriptor<InstanceType>>(
    'injectAtomWithoutSubscription',
    InjectorType.Atom,
    () => {
      const instance = ecosystem.load(atom, params)
      ecosystem.graph.addStaticDependency(keyHash, instance.internals.keyHash)

      return {
        instance,
        type: InjectorType.Atom,
      }
    },
    prevDescriptor => {
      const atomHasChanged =
        atom.internalId !== prevDescriptor.instance.internals.atomInternalId

      const paramsHaveChanged = haveDepsChanged(
        prevDescriptor.instance.internals.params,
        params
      )

      if (!atomHasChanged && !paramsHaveChanged) return prevDescriptor

      const instance = ecosystem.load(atom, params)

      // update the graph
      ecosystem.graph.removeStaticDependency(
        keyHash,
        prevDescriptor.instance.internals.keyHash
      )
      ecosystem.graph.addStaticDependency(keyHash, instance.internals.keyHash)

      prevDescriptor.instance = instance
      return prevDescriptor
    }
  )

  return instance
}
