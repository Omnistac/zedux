import { getEcosystem } from '../store/public-api'
import { AtomBaseProperties, AtomInstanceBase } from '../types'
import {
  split,
  AtomWithSubscriptionInjectorDescriptor,
  InjectorType,
  haveDepsChanged,
} from '../utils'
import { diContext } from '../utils/csContexts'

/**
 * injectAtomWithSubscription
 *
 * Creates an atom instance for the passed atom based on the passed params. If
 * an instance has already been created for the passed params, reuses the
 * existing instance.
 *
 * Subscribes to the instance's store.
 *
 * This is a low-level injector that probably shouldn't be used directly. Use
 * the injectors built into atoms - e.g.
 *
 * ```ts
 * const [state, setState, store] = myAtom.injectState()
 * ```
 */
export const injectAtomWithSubscription = <
  State = any,
  Params extends any[] = [],
  InstanceType extends AtomInstanceBase<State, Params> = AtomInstanceBase<
    State,
    Params
  >
>(
  operation: string,
  atom: AtomBaseProperties<State, Params, InstanceType>,
  params: Params
) => {
  const { ecosystemId, keyHash } = diContext.consume()
  const ecosystem = getEcosystem(ecosystemId)

  const { instance } = split<
    AtomWithSubscriptionInjectorDescriptor<InstanceType>
  >(
    'injectAtomWithoutSubscription',
    InjectorType.AtomWithSubscription,
    () => {
      const instance = ecosystem.load(atom, params)
      ecosystem.graph.addDependency(keyHash, instance.internals.keyHash)

      const cleanup = () => {
        ecosystem.graph.removeDependency(keyHash, instance.internals.keyHash)
      }

      return {
        cleanup,
        instance,
        type: InjectorType.AtomWithSubscription,
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
      prevDescriptor.cleanup?.()
      ecosystem.graph.addDependency(keyHash, instance.internals.keyHash)

      prevDescriptor.cleanup = () => {
        ecosystem.graph.removeDependency(keyHash, instance.internals.keyHash)
      }
      prevDescriptor.instance = instance

      return prevDescriptor
    }
  )

  return instance
}
