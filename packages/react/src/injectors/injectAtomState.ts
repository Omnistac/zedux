import { AtomInstance, AtomBase } from '../classes'
import {
  AnyAtom,
  AtomExportsType,
  AtomInstanceExportsType,
  AtomInstanceStateType,
  AtomParamsType,
  AtomStateType,
  StateHookTuple,
} from '../types'
import { injectAtomInstance } from './injectAtomInstance'

export const injectAtomState: {
  <A extends AtomBase<any, [], any, any, any, any>>(atom: A): StateHookTuple<
    AtomStateType<A>,
    AtomExportsType<A>
  >

  <A extends AnyAtom>(atom: A, params: AtomParamsType<A>): StateHookTuple<
    AtomStateType<A>,
    AtomExportsType<A>
  >

  <AI extends AtomInstance<any, [...any], any, any, any>>(
    instance: AI
  ): StateHookTuple<AtomInstanceStateType<AI>, AtomInstanceExportsType<AI>>
} = <A extends AnyAtom>(
  atom: A,
  params?: AtomParamsType<A>
): StateHookTuple<AtomStateType<A>, AtomExportsType<A>> => {
  const instance = injectAtomInstance(atom, params as AtomParamsType<A>, {
    operation: 'injectAtomState',
    subscribe: true,
  }) as AtomInstance<AtomStateType<A>, [...any], any, any, any>

  const setState: any = (settable: any, meta?: any) =>
    instance.setState(settable, meta)

  Object.assign(setState, instance.exports)

  return [instance.store.getState(), setState]
}
