import {
  AtomInjectorDescriptor,
  haveDepsChanged,
  InjectorType,
  split,
} from '../utils'
import { diContext } from '../utils/csContexts'
import { AtomBase } from '../classes/atoms/AtomBase'
import { AtomInstanceType, AtomParamsType } from '../types'

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
  A extends AtomBase<any, any, any>
>(
  operation: string,
  atom: A,
  params: AtomParamsType<A>
) => {
  const {
    instance: { ecosystem, keyHash },
  } = diContext.consume()

  const { instance } = split<AtomInjectorDescriptor<AtomInstanceType<A>>>(
    'injectAtomWithoutSubscription',
    InjectorType.Atom,
    () => {
      const instance = ecosystem.load(atom, params)
      const edge = ecosystem._graph.addDependency(
        keyHash,
        instance.keyHash,
        operation,
        true
      )

      const cleanup = () => {
        ecosystem._graph.removeDependency(keyHash, instance.keyHash, edge)
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
      const edge = ecosystem._graph.addDependency(
        keyHash,
        instance.keyHash,
        operation,
        true
      )

      prevDescriptor.cleanup = () => {
        ecosystem._graph.removeDependency(keyHash, instance.keyHash, edge)
      }
      prevDescriptor.instance = instance

      return prevDescriptor
    }
  )

  return instance
}
