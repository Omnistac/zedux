import {
  AtomInjectorDescriptor,
  haveDepsChanged,
  InjectorType,
  split,
} from '../utils'
import { diContext } from '../utils/csContexts'
import { AtomInstanceBase } from '../classes/instances/AtomInstanceBase'
import { AtomBase } from '../classes/atoms/AtomBase'

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
 * const [state, setState] = myAtom.injectState()
 * ```
 */
export const injectAtomWithoutSubscription = <
  State = any,
  Params extends any[] = [],
  InstanceType extends AtomInstanceBase<
    State,
    Params,
    AtomBase<State, Params, any>
  > = AtomInstanceBase<State, Params, AtomBase<State, Params, any>>
>(
  operation: string,
  atom: AtomBase<State, Params, InstanceType>,
  params: Params
) => {
  const {
    instance: { ecosystem, keyHash },
  } = diContext.consume()

  const { instance } = split<AtomInjectorDescriptor<InstanceType>>(
    'injectAtomWithoutSubscription',
    InjectorType.Atom,
    () => {
      const instance = ecosystem.load(atom, params)
      ecosystem.graph.addDependency(keyHash, instance.keyHash, operation, true)

      const cleanup = () => {
        ecosystem.graph.removeDependency(keyHash, instance.keyHash)
      }

      return {
        cleanup,
        instance,
        type: InjectorType.Atom,
      }
    },
    prevDescriptor => {
      const atomHasChanged =
        atom.internalId !== prevDescriptor.instance.atom.internalId

      const paramsHaveChanged = haveDepsChanged(
        prevDescriptor.instance.params,
        params
      )

      if (!atomHasChanged && !paramsHaveChanged) return prevDescriptor

      const instance = ecosystem.load(atom, params)

      // update the graph
      prevDescriptor.cleanup?.()
      ecosystem.graph.addDependency(keyHash, instance.keyHash, operation, true)

      prevDescriptor.cleanup = () => {
        ecosystem.graph.removeDependency(keyHash, instance.keyHash)
      }
      prevDescriptor.instance = instance

      return prevDescriptor
    }
  )

  return instance
}
