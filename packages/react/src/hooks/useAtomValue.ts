import { AtomBase, AtomInstanceBase } from '../classes'
import { AtomParamsType, AtomStateType } from '../types'
import { useAtomInstanceDynamic } from './useAtomInstanceDynamic'

export const useAtomValue: {
  <A extends AtomBase<any, [], any>>(atom: A): AtomStateType<A>
  <A extends AtomBase<any, any, any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomStateType<A>
} = <A extends AtomBase<any, any, any>>(
  atom: A,
  params?: AtomParamsType<A>
) => {
  const instance = useAtomInstanceDynamic(
    atom,
    params as AtomParamsType<A>
  ) as AtomInstanceBase<AtomStateType<A>, any, any>

  return instance._stateStore.getState()
}
