import { AtomInstance, AtomTemplateBase } from '../classes'
import {
  AnyAtomGenerics,
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomParamsType,
  AtomStateType,
  ParamlessTemplate,
} from '../types/index'
import { injectAtomInstance } from './injectAtomInstance'

export const injectAtomValue: {
  <A extends AnyAtomTemplate>(
    template: A,
    params: AtomParamsType<A>
  ): AtomStateType<A>

  <A extends AnyAtomTemplate<{ Params: [] }>>(template: A): AtomStateType<A>

  <A extends AnyAtomTemplate>(template: ParamlessTemplate<A>): AtomStateType<A>

  <I extends AnyAtomInstance>(instance: I): AtomStateType<I>
} = <G extends AnyAtomGenerics<{ Node: AtomInstance }>>(
  atom: AtomTemplateBase<G>,
  params?: G['Params']
) =>
  injectAtomInstance(atom, params, {
    operation: 'injectAtomValue',
    subscribe: true,
  }).get()
