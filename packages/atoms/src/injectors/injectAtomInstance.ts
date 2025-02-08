import { Eventless, EventlessStatic } from '../utils/general'
import {
  AnyAtomInstance,
  AnyAtomTemplate,
  InjectAtomInstanceConfig,
  NodeOf,
  ParamlessTemplate,
  ParamsOf,
  Selectable,
} from '../types/index'
import { injectSelf } from './injectSelf'

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
  <A extends AnyAtomTemplate>(
    template: A,
    params: ParamsOf<A>,
    config?: InjectAtomInstanceConfig
  ): NodeOf<A>

  <A extends AnyAtomTemplate<{ Params: [] }>>(template: A): NodeOf<A>

  <A extends AnyAtomTemplate>(template: ParamlessTemplate<A>): NodeOf<A>

  <I extends AnyAtomInstance>(
    instance: I,
    params?: [],
    config?: InjectAtomInstanceConfig
  ): I

  <S extends Selectable>(
    template: S,
    params: ParamsOf<S>,
    config?: InjectAtomInstanceConfig
  ): NodeOf<S>

  <S extends Selectable<any, []>>(template: S): NodeOf<S>

  <S extends Selectable>(template: ParamlessTemplate<S>): NodeOf<S>
} = <A extends AnyAtomInstance>(
  template: A,
  params?: ParamsOf<A>,
  config?: InjectAtomInstanceConfig
) =>
  injectSelf().e.getNode(template, params, {
    f: config?.subscribe ? Eventless : EventlessStatic,
    op: config?.operation || defaultOperation,
  })
