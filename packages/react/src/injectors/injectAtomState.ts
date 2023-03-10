import {
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomExportsType,
  AtomParamsType,
  AtomStateType,
  ParamlessTemplate,
  StateHookTuple,
} from '../types'
import { injectAtomInstance } from './injectAtomInstance'

export const injectAtomState: {
  <A extends ParamlessTemplate>(atom: A): StateHookTuple<
    AtomStateType<A>,
    AtomExportsType<A>
  >

  <A extends AnyAtomTemplate>(
    atom: A,
    params: AtomParamsType<A>
  ): StateHookTuple<AtomStateType<A>, AtomExportsType<A>>

  <I extends AnyAtomInstance>(instance: I): StateHookTuple<
    AtomStateType<I>,
    AtomExportsType<I>
  >
} = <A extends AnyAtomTemplate>(
  atom: A,
  params?: AtomParamsType<A>
): StateHookTuple<AtomStateType<A>, AtomExportsType<A>> => {
  const instance = injectAtomInstance(atom, params as AtomParamsType<A>, {
    operation: 'injectAtomState',
    subscribe: true,
  })

  return [instance.getState(), instance._infusedSetter]
}
