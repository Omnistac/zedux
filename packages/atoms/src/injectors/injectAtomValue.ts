import { AtomInstance, AtomTemplateBase } from '../classes'
import {
  AnyAtomGenerics,
  AnyAtomInstance,
  AnyAtomTemplate,
  ParamlessTemplate,
  ParamsOf,
  StateOf,
} from '../types/index'
import { injectAtomInstance } from './injectAtomInstance'

export const injectAtomValue: {
  <A extends AnyAtomTemplate>(template: A, params: ParamsOf<A>): StateOf<A>

  <A extends AnyAtomTemplate<{ Params: [] }>>(template: A): StateOf<A>

  <A extends AnyAtomTemplate>(template: ParamlessTemplate<A>): StateOf<A>

  <I extends AnyAtomInstance>(instance: I): StateOf<I>
} = <G extends AnyAtomGenerics<{ Node: AtomInstance }>>(
  atom: AtomTemplateBase<G>,
  params?: G['Params']
) =>
  injectAtomInstance(atom, params, {
    operation: 'injectAtomValue',
    subscribe: true,
  }).v
