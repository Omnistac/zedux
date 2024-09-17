import { AtomInstance } from '../classes/instances/AtomInstance'
import { AtomTemplateBase } from '../classes/templates/AtomTemplateBase'
import {
  AnyAtomGenerics,
  AnyAtomTemplate,
  AtomExportsType,
  AtomParamsType,
  AtomStateType,
  ParamlessTemplate,
  StateHookTuple,
} from '../types/index'
import { injectAtomInstance } from './injectAtomInstance'

// `injectAtomState` is currently only compatible with templates that create
// instances of Zedux's internal AtomInstance (like Zedux's own AtomTemplate and
// IonTemplate). TODO: change this. Also TODO: add jsdoc (for all injectors)
export const injectAtomState: {
  <A extends AnyAtomTemplate<{ Node: AtomInstance }>>(
    template: A,
    params: AtomParamsType<A>
  ): StateHookTuple<AtomStateType<A>, AtomExportsType<A>>

  <A extends AnyAtomTemplate<{ Node: AtomInstance; Params: [] }>>(
    template: A
  ): StateHookTuple<AtomStateType<A>, AtomExportsType<A>>

  <A extends AnyAtomTemplate<{ Node: AtomInstance }>>(
    template: ParamlessTemplate<A>
  ): StateHookTuple<AtomStateType<A>, AtomExportsType<A>>

  <I extends AtomInstance>(instance: I): StateHookTuple<
    AtomStateType<I>,
    AtomExportsType<I>
  >
} = <G extends AnyAtomGenerics<{ Node: AtomInstance }>>(
  atom: AtomTemplateBase<G>,
  params?: G['Params']
): StateHookTuple<G['State'], G['Exports']> => {
  const instance = injectAtomInstance(atom, params, {
    operation: 'injectAtomState',
    subscribe: true,
  })

  return [instance.get(), instance._infusedSetter]
}
