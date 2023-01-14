import {
  AtomInjectorDescriptor,
  haveDepsChanged,
  InjectorType,
  is,
  split,
} from '../utils'
import {
  AnyAtomInstanceBase,
  AtomInstanceType,
  AtomParamsType,
  EdgeFlag,
} from '../types'
import { injectAtomGetters } from './injectAtomGetters'
import { AtomBase, AtomInstanceBase } from '../classes'

/**
 * injectAtomInstance
 *
 * Creates an atom instance for the passed atom based on the passed params. If
 * an instance has already been created for the passed params, reuses the
 * existing instance.
 *
 * Registers a static graph dependency on the atom instance. This means atoms
 * that use this injector will *not* reevaluate when this atom instance's state
 * changes.
 *
 * Pass false as the 4th param to prevent this graph dependency from being
 * registered. Useful when you need to control the graph dependency manually.
 * `injectAtomSelector` does this internally.
 *
 * @param atom The atom to instantiate or reuse an instantiation of.
 * @param params The params for generating the instance's key.
 * @param operation The operation name (e.g. name of the injector function)
 * that's triggering this graph dependency. If you're using this injector
 * directly in an atom, it's fine to omit this parameter.
 * @returns An atom instance, keyed based on the passed params.
 */
export const injectAtomInstance: {
  <A extends AtomBase<any, [], any>>(atom: A): AtomInstanceType<A>

  <A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>,
    operation?: string
  ): AtomInstanceType<A>

  <AI extends AtomInstanceBase<any, [...any], any>>(
    instance: AI,
    params?: [],
    operation?: string
  ): AI
} = <A extends AtomBase<any, [...any], any>>(
  atom: A | AnyAtomInstanceBase,
  params?: AtomParamsType<A>,
  operation = 'injectAtomInstance'
) => {
  const { getInstance } = injectAtomGetters()

  const { instance } = split<AtomInjectorDescriptor<AtomInstanceType<A>>>(
    'injectAtomInstance',
    InjectorType.Atom,
    () => {
      const instance = getInstance(atom as A, params as AtomParamsType<A>, [
        EdgeFlag.Static,
        operation,
      ])

      return {
        instance: instance as AtomInstanceType<A>,
        type: InjectorType.Atom,
      }
    },
    prevDescriptor => {
      const resolvedAtom = is(atom, AtomInstanceBase)
        ? (atom as AnyAtomInstanceBase).atom
        : (atom as A)

      const atomHasChanged = resolvedAtom !== prevDescriptor.instance.atom

      const paramsHaveChanged = haveDepsChanged(
        prevDescriptor.instance.params,
        params,
        true
      )

      if (!atomHasChanged && !paramsHaveChanged) {
        // make sure the dependency gets registered for this evaluation
        getInstance(atom as A, params as AtomParamsType<A>)

        return prevDescriptor
      }

      const instance = getInstance(atom as A, params as AtomParamsType<A>, [
        EdgeFlag.Static,
        operation,
      ])

      prevDescriptor.instance = instance as AtomInstanceType<A>

      return prevDescriptor
    }
  )

  return instance
}
