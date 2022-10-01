import { AtomBase, AtomInstanceBase } from '../classes'
import {
  AtomInstanceStateType,
  AtomParamsType,
  AtomStateType,
  ZeduxHookConfig,
} from '../types'
import { useAtomInstanceDynamic } from './useAtomInstanceDynamic'

export const useAtomValue: {
  <A extends AtomBase<any, [], any>>(atom: A): AtomStateType<A>

  <A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>,
    config?: ZeduxHookConfig
  ): AtomStateType<A>

  <AI extends AtomInstanceBase<any, [...any], any>>(
    instance: AI,
    params?: [],
    config?: ZeduxHookConfig
  ): AtomInstanceStateType<AI>
} = <A extends AtomBase<any, [...any], any>>(
  atom: A,
  params?: AtomParamsType<A>,
  config: ZeduxHookConfig = { operation: 'useAtomValue' }
) => {
  const [state] = useAtomInstanceDynamic(
    atom,
    params as AtomParamsType<A>,
    config
  )

  return state
}
