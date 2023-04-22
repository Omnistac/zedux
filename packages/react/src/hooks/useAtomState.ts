import {
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomExportsType,
  AtomParamsType,
  AtomStateType,
  ParamlessTemplate,
  StateHookTuple,
} from '@zedux/atoms'
import { ZeduxHookConfig } from '../types'
import { useAtomInstance } from './useAtomInstance'

export const useAtomState: {
  <A extends AnyAtomTemplate>(
    template: A,
    params: AtomParamsType<A>,
    config?: Omit<ZeduxHookConfig, 'subscribe'>
  ): StateHookTuple<AtomStateType<A>, AtomExportsType<A>>

  <A extends AnyAtomTemplate>(template: ParamlessTemplate<A>): StateHookTuple<
    AtomStateType<A>,
    AtomExportsType<A>
  >

  <I extends AnyAtomInstance>(
    instance: I,
    params?: [],
    config?: Omit<ZeduxHookConfig, 'subscribe'>
  ): StateHookTuple<AtomStateType<I>, AtomExportsType<I>>
} = <A extends AnyAtomTemplate>(
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
