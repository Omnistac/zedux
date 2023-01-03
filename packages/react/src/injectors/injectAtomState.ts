import { AtomInstance, StandardAtomBase } from '../classes'
import {
  AtomExportsType,
  AtomInstanceExportsType,
  AtomInstanceStateType,
  AtomParamsType,
  AtomStateType,
  StateHookTuple,
} from '../types'
import { injectAtomInstanceDynamic } from './injectAtomInstanceDynamic'

export const injectAtomState: {
  <A extends StandardAtomBase<any, [], any, any>>(atom: A): StateHookTuple<
    AtomStateType<A>,
    AtomExportsType<A>
  >

  <A extends StandardAtomBase<any, [...any], any, any>>(
    atom: A,
    params: AtomParamsType<A>
  ): StateHookTuple<AtomStateType<A>, AtomExportsType<A>>

  <AI extends AtomInstance<any, [...any], any, any>>(
    instance: AI
  ): StateHookTuple<AtomInstanceStateType<AI>, AtomInstanceExportsType<AI>>
} = <A extends StandardAtomBase<any, [...any], any, any>>(
  atom: A,
  params?: AtomParamsType<A>
): StateHookTuple<AtomStateType<A>, AtomExportsType<A>> => {
  const instance = injectAtomInstanceDynamic(
    atom,
    params as AtomParamsType<A>,
    'injectAtomState'
  ) as AtomInstance<AtomStateType<A>, [...any], any, any>

  const setState: any = (settable: any, meta?: any) =>
    instance.setState(settable, meta)

  Object.assign(setState, instance.exports)

  return [instance.store.getState(), setState]
}
