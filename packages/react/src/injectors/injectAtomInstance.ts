import { InjectorDescriptor, prefix, Static } from '../utils'
import {
  AnyAtom,
  AnyAtomInstance,
  AtomInstanceType,
  AtomParamsType,
  InjectAtomInstanceConfig,
  ParamlessAtom,
  PartialAtomInstance,
} from '../types'
import { createInjector } from '../factories'

const defaultOperation = 'injectAtomInstance'

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
  <A extends ParamlessAtom>(atom: A): AtomInstanceType<A>

  <A extends AnyAtom>(
    atom: A,
    params: AtomParamsType<A>,
    config?: InjectAtomInstanceConfig
  ): AtomInstanceType<A>

  <AI extends AnyAtomInstance>(
    instance: AI,
    params?: [],
    config?: InjectAtomInstanceConfig
  ): AI
} = createInjector(
  defaultOperation,
  <A extends AnyAtom>(
    instance: PartialAtomInstance,
    atom: A | AnyAtomInstance,
    params?: AtomParamsType<A>,
    config?: InjectAtomInstanceConfig
  ) => {
    const injectedInstance = instance.ecosystem._evaluationStack.atomGetters.getInstance(
      atom as A,
      params as AtomParamsType<A>,
      [config?.subscribe ? 0 : Static, config?.operation || defaultOperation]
    )

    return {
      result: injectedInstance as AtomInstanceType<A>,
      type: `${prefix}/atom`,
    } as InjectorDescriptor<AtomInstanceType<A>>
  },
  <A extends AnyAtom>(
    prevDescriptor: InjectorDescriptor<AtomInstanceType<A>>,
    instance: PartialAtomInstance,
    atom: A | AnyAtomInstance,
    params?: AtomParamsType<A>,
    config?: InjectAtomInstanceConfig
  ) => {
    // make sure the dependency gets registered for this evaluation
    const injectedInstance = instance.ecosystem._evaluationStack.atomGetters.getInstance(
      atom as A,
      params as AtomParamsType<A>,
      [config?.subscribe ? 0 : Static, config?.operation || defaultOperation]
    )

    prevDescriptor.result = injectedInstance as AtomInstanceType<A>

    return prevDescriptor
  }
)
