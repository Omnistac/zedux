import { Atom, AtomInstance } from '../classes'
import { AtomInstanceType, AtomParamsType } from '../types'
import {
  split,
  AtomDynamicInjectorDescriptor,
  InjectorType,
  haveDepsChanged,
  GraphEdgeDynamicity,
} from '../utils'
import { injectGetInstance } from './injectGetInstance'

const defaultOperation = 'injectAtomInstanceDynamic'

/**
 * injectAtomInstanceDynamic
 *
 * Creates an atom instance for the passed atom based on the passed params. If
 * an instance has already been created for the passed params, reuses the
 * existing instance.
 *
 * Registers a dynamic graph dependency on the atom instance. This means atoms
 * that use this injector *will* reevaluate when this atom instance's state
 * changes.
 *
 * This is a low-level injector that probably shouldn't be used directly. Use
 * higher-level injectors like injectAtomValue, injectAtomState, and
 * injectAtomSelector
 *
 * ```ts
 * const [state, setState] = injectAtomState(myAtom)
 * ```
 *
 * @param atom The atom to instantiate or reuse an instantiation of.
 * @param params The params for generating the instance's key.
 * @param operation The operation name (e.g. name of the injector function)
 * that's triggering this graph dependency. If you're using this injector
 * directly in an atom, it's fine to omit this parameter.
 * @returns An atom instance, keyed based on the passed params.
 */
export const injectAtomInstanceDynamic: {
  <A extends Atom<any, [], any>>(atom: A): AtomInstanceType<A>

  <A extends Atom<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>,
    operation?: string
  ): AtomInstanceType<A>

  <AI extends AtomInstance<any, [...any], any, any>>(
    instance: AI,
    params?: [],
    operation?: string
  ): AI
} = <A extends Atom<any, [...any], any>>(
  atom: A,
  params?: AtomParamsType<A>,
  operation = defaultOperation
) => {
  const getInstance = injectGetInstance()

  const { instance } = split<
    AtomDynamicInjectorDescriptor<AtomInstanceType<A>>
  >(
    defaultOperation, // yeah, not the passed operation
    InjectorType.AtomDynamic,
    () => {
      const instance = getInstance(atom, params as AtomParamsType<A>, [
        GraphEdgeDynamicity.Dynamic,
        operation,
      ])

      return {
        instance: instance as AtomInstanceType<A>,
        type: InjectorType.AtomDynamic,
      }
    },
    prevDescriptor => {
      const resolvedAtom = atom instanceof AtomInstance ? atom.atom : atom
      const atomHasChanged =
        resolvedAtom.internalId !== prevDescriptor.instance.atom.internalId

      const paramsHaveChanged = haveDepsChanged(
        prevDescriptor.instance.params,
        params,
        false
      )

      // make sure the dependency gets registered for this evaluation
      const instance = getInstance(atom, params as AtomParamsType<A>, [
        GraphEdgeDynamicity.Dynamic,
        operation,
      ])

      if (!atomHasChanged && !paramsHaveChanged) {
        return prevDescriptor
      }

      prevDescriptor.instance = instance as AtomInstanceType<A>

      return prevDescriptor
    }
  )

  return instance
}
