import {
  AtomInjectorDescriptor,
  GraphEdgeDynamicity,
  haveDepsChanged,
  InjectorType,
  split,
} from '../utils'
import { AtomBase } from '../classes/atoms/AtomBase'
import { AtomInstanceType, AtomParamsType } from '../types'
import { injectGetInstance } from './injectGetInstance'
import { injectEcosystem } from './injectEcosystem'
import { AtomInstanceBase } from '../classes'

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
  <A extends AtomBase<any, any, any>>(
    atom: A,
    params: AtomParamsType<A>,
    operation?: string,
    shouldRegisterDependency?: boolean
  ): AtomInstanceType<A>
  <AI extends AtomInstanceBase<any, any, any>>(
    instance: AI | AtomBase<any, any, any>,
    params?: [],
    operation?: string,
    shouldRegisterDependency?: boolean
  ): AI
} = <A extends AtomBase<any, any, any>>(
  atom: A | AtomInstanceBase<any, any, any>,
  params?: AtomParamsType<A>,
  operation = 'injectAtomInstance',
  shouldRegisterDependency = true
) => {
  const ecosystem = injectEcosystem()
  const getInstance = injectGetInstance()

  const { instance } = split<AtomInjectorDescriptor<AtomInstanceType<A>>>(
    'injectAtomInstance',
    InjectorType.Atom,
    () => {
      const instance =
        atom instanceof AtomInstanceBase
          ? atom
          : shouldRegisterDependency
          ? getInstance(atom, params as AtomParamsType<A>, [
              GraphEdgeDynamicity.Static,
              operation,
            ])
          : ecosystem.getInstance(atom, params as AtomParamsType<A>)

      return {
        instance: instance as AtomInstanceType<A>,
        type: InjectorType.Atom,
      }
    },
    prevDescriptor => {
      const resolvedAtom = atom instanceof AtomInstanceBase ? atom.atom : atom
      const atomHasChanged =
        resolvedAtom.internalId !== prevDescriptor.instance.atom.internalId

      const paramsHaveChanged = haveDepsChanged(
        prevDescriptor.instance.params,
        params
      )

      if (!atomHasChanged && !paramsHaveChanged) return prevDescriptor

      const instance =
        atom instanceof AtomInstanceBase
          ? atom
          : shouldRegisterDependency
          ? getInstance(atom, params as AtomParamsType<A>, [
              GraphEdgeDynamicity.Static,
              operation,
            ])
          : ecosystem.getInstance(atom, params as AtomParamsType<A>)

      prevDescriptor.instance = instance as AtomInstanceType<A>

      return prevDescriptor
    }
  )

  return instance
}
