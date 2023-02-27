import { AtomBase, AtomInstanceBase } from '../classes'
import {
  AtomInstanceStateType,
  AtomParamsType,
  AtomStateType,
  ZeduxHookConfig,
} from '../types'
import { useAtomInstance } from './useAtomInstance'

export const useAtomValue: {
  <A extends AtomBase<any, [], any>>(atom: A): AtomStateType<A>

  <A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>,
    config?: Omit<ZeduxHookConfig, 'subscribe'>
  ): AtomStateType<A>

  <AI extends AtomInstanceBase<any, [...any], any>>(
    instance: AI,
    params?: [],
    config?: Omit<ZeduxHookConfig, 'subscribe'>
  ): AtomInstanceStateType<AI>
} = <A extends AtomBase<any, [...any], any>>(
  atom: A,
  params?: AtomParamsType<A>,
  config: Omit<ZeduxHookConfig, 'subscribe'> = { operation: 'useAtomValue' }
) => {
  const instance = useAtomInstance(atom, params as AtomParamsType<A>, {
    ...config,
    subscribe: true,
  })

  return instance.getState()
}
