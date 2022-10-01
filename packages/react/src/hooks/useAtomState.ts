import { Settable } from '@zedux/core'
import { AtomBase, AtomInstanceBase } from '../classes'
import {
  AtomInstanceStateType,
  AtomParamsType,
  AtomStateType,
  ZeduxHookConfig,
} from '../types'
import { useAtomInstanceDynamic } from './useAtomInstanceDynamic'

export const useAtomState: {
  <A extends AtomBase<any, [], any>>(atom: A): [
    AtomStateType<A>,
    (settable: Settable<AtomStateType<A>>) => AtomStateType<A>
  ]

  <A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>,
    config?: ZeduxHookConfig
  ): [
    AtomStateType<A>,
    (settable: Settable<AtomStateType<A>>) => AtomStateType<A>
  ]

  <AI extends AtomInstanceBase<any, [...any], any>>(
    instance: AI,
    params?: [],
    config?: ZeduxHookConfig
  ): [
    AtomInstanceStateType<AI>,
    (settable: Settable<AtomInstanceStateType<AI>>) => AtomInstanceStateType<AI>
  ]
} = <A extends AtomBase<any, [...any], any>>(
  atom: A,
  params?: AtomParamsType<A>,
  config: ZeduxHookConfig = { operation: 'useAtomState' }
): [
  AtomStateType<A>,
  (settable: Settable<AtomStateType<A>>) => AtomStateType<A>
] => {
  const [state, instance] = useAtomInstanceDynamic(
    atom,
    params as AtomParamsType<A>,
    config
  )

  return [state, instance.setState]
}
