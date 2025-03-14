import { AtomInstance } from '../classes/instances/AtomInstance'
import { AtomTemplateBase } from '../classes/templates/AtomTemplateBase'
import {
  AnyAtomGenerics,
  AnyAtomTemplate,
  ExportsOf,
  ParamlessTemplate,
  ParamsOf,
  StateHookTuple,
  StateOf,
} from '../types/index'
import { injectAtomInstance } from './injectAtomInstance'

// `injectAtomState` is currently only compatible with templates that create
// instances of Zedux's internal AtomInstance (like Zedux's own AtomTemplate and
// IonTemplate). TODO: change this. Also TODO: add jsdoc (for all injectors)
export const injectAtomState: {
  <A extends AnyAtomTemplate<{ Node: AtomInstance }>>(
    template: A,
    params: ParamsOf<A>
  ): StateHookTuple<StateOf<A>, ExportsOf<A>>

  <A extends AnyAtomTemplate<{ Node: AtomInstance; Params: [] }>>(
    template: A
  ): StateHookTuple<StateOf<A>, ExportsOf<A>>

  <A extends AnyAtomTemplate<{ Node: AtomInstance }>>(
    template: ParamlessTemplate<A>
  ): StateHookTuple<StateOf<A>, ExportsOf<A>>

  <I extends AtomInstance>(instance: I): StateHookTuple<
    StateOf<I>,
    ExportsOf<I>
  >
} = <G extends AnyAtomGenerics<{ Node: AtomInstance }>>(
  atom: AtomTemplateBase<G>,
  params?: G['Params']
): StateHookTuple<G['State'], G['Exports']> => {
  const instance = injectAtomInstance(atom, params, {
    operation: 'injectAtomState',
    subscribe: true,
  })

  return [instance.v, instance.x]
}
