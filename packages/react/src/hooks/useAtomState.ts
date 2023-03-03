import { AtomInstance, AtomBase } from '../classes'
import {
  AnyAtom,
  AtomExportsType,
  AtomParamsType,
  AtomStateType,
  StateHookTuple,
  ZeduxHookConfig,
} from '../types'
import { useAtomInstance } from './useAtomInstance'

export const useAtomState: {
  <A extends AtomBase<any, [], any, any, any, any>>(atom: A): StateHookTuple<
    AtomStateType<A>,
    AtomExportsType<A>
  >

  <A extends AnyAtom>(
    atom: A,
    params: AtomParamsType<A>,
    config?: Omit<ZeduxHookConfig, 'subscribe'>
  ): StateHookTuple<AtomStateType<A>, AtomExportsType<A>>

  <AI extends AtomInstance<any, [...any], any, any, any>>(
    instance: AI,
    params?: [],
    config?: Omit<ZeduxHookConfig, 'subscribe'>
  ): StateHookTuple<AtomStateType<AI>, AtomExportsType<AI>>
} = <A extends AnyAtom>(
  atom: A,
  params?: AtomParamsType<A>,
  config: Omit<ZeduxHookConfig, 'subscribe'> = { operation: 'useAtomState' }
): StateHookTuple<AtomStateType<A>, AtomExportsType<A>> => {
  const instance = useAtomInstance(atom, params as AtomParamsType<A>, {
    ...config,
    subscribe: true,
  })

  return [instance.getState(), instance._infusedSetter]
}
