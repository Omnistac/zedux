import { AtomBase, AtomInstanceBase } from '../classes'
import { AtomInstanceStateType, AtomParamsType, AtomStateType } from '../types'
import { useAtomInstanceDynamic } from './useAtomInstanceDynamic'

export const useAtomValue: {
  <A extends AtomBase<any, [], any>>(atom: A): AtomStateType<A>

  <A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomStateType<A>

  <AI extends AtomInstanceBase<any, [...any], any>>(
    instance: AI
  ): AtomInstanceStateType<AI>
} = <A extends AtomBase<any, [...any], any>>(
  atom: A,
  params?: AtomParamsType<A>
) => {
  const instance = useAtomInstanceDynamic(
    atom,
    params as AtomParamsType<A>,
    'useAtomValue'
  ) as AtomInstanceBase<AtomStateType<A>, [...any], any>

  return instance.store.getState()
}
