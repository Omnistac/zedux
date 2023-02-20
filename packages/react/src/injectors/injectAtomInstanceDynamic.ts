import { AtomBase, AtomInstanceBase } from '../classes'
import { createInjector } from '../factories'
import { AnyAtomInstanceBase, AtomInstanceType, AtomParamsType } from '../types'
import { haveDepsChanged, InjectorDescriptor, is, prefix } from '../utils'

const defaultOperation = 'injectAtomInstanceDynamic'

/**
 * injectAtomInstanceDynamic
 *
 * Creates an atom instance for the passed atom based on the passed params. If
 * an instance has already been created in this ecosystem for the passed params,
 * reuses the existing instance.
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
} = createInjector(
  'injectAtomInstanceDynamic',
  <A extends AtomBase<any, [...any], any>>(
    instance: AnyAtomInstanceBase,
    atom: A | AnyAtomInstanceBase,
    params?: AtomParamsType<A>,
    operation = defaultOperation
  ) => {
    const injectedInstance = instance.ecosystem._evaluationStack.atomGetters.getInstance(
      atom as A,
      params as AtomParamsType<A>,
      [0, operation]
    )

    return {
      result: injectedInstance as AtomInstanceType<A>,
      type: `${prefix}/atomDynamic`,
    } as InjectorDescriptor<AtomInstanceType<A>>
  },
  <A extends AtomBase<any, [...any], any>>(
    prevDescriptor: InjectorDescriptor<AtomInstanceType<A>>,
    instance: AnyAtomInstanceBase,
    atom: A | AnyAtomInstanceBase,
    params?: AtomParamsType<A>,
    operation = defaultOperation
  ) => {
    const resolvedAtom = is(atom, AtomInstanceBase)
      ? (atom as AnyAtomInstanceBase).atom
      : (atom as A)

    const atomHasChanged = resolvedAtom !== prevDescriptor.result.atom

    const paramsHaveChanged = haveDepsChanged(
      prevDescriptor.result.params,
      params,
      true
    )

    // make sure the dependency gets registered for this evaluation
    const injectedInstance = instance.ecosystem._evaluationStack.atomGetters.getInstance(
      atom as A,
      params as AtomParamsType<A>,
      [0, operation]
    )

    if (!atomHasChanged && !paramsHaveChanged) {
      return prevDescriptor
    }

    prevDescriptor.result = injectedInstance as AtomInstanceType<A>

    return prevDescriptor
  }
)
