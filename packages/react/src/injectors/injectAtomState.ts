import {
  AnyAtom,
  AnyAtomInstance,
  AtomExportsType,
  AtomParamsType,
  AtomStateType,
  ParamlessAtom,
  StateHookTuple,
} from '../types'
import { injectAtomInstance } from './injectAtomInstance'

export const injectAtomState: {
  <A extends ParamlessAtom>(atom: A): StateHookTuple<
    AtomStateType<A>,
    AtomExportsType<A>
  >

  <A extends AnyAtom>(atom: A, params: AtomParamsType<A>): StateHookTuple<
    AtomStateType<A>,
    AtomExportsType<A>
  >

  <AI extends AnyAtomInstance>(instance: AI): StateHookTuple<
    AtomStateType<AI>,
    AtomExportsType<AI>
  >
} = <A extends AnyAtom>(
  atom: A,
  params?: AtomParamsType<A>
): StateHookTuple<AtomStateType<A>, AtomExportsType<A>> => {
  const instance = injectAtomInstance(atom, params as AtomParamsType<A>, {
    operation: 'injectAtomState',
    subscribe: true,
  })

  return [instance.getState(), instance._infusedSetter]
}
