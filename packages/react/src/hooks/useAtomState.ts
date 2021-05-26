import { Settable } from '@zedux/core'
import { AtomBase, AtomInstance, AtomInstanceBase } from '../classes'
import { AtomParamsType, AtomStateType } from '../types'
import { useAtomInstanceDynamic } from './useAtomInstanceDynamic'

export const useAtomState: {
  <A extends AtomBase<any, [], any>>(atom: A): [
    AtomStateType<A>,
    (settable: Settable<AtomStateType<A>>) => AtomStateType<A>
  ]
  <A extends AtomBase<any, any, any>>(atom: A, params: AtomParamsType<A>): [
    AtomStateType<A>,
    (settable: Settable<AtomStateType<A>>) => AtomStateType<A>
  ]
} = <A extends AtomBase<any, any, any>>(
  atom: A,
  params?: AtomParamsType<A>
): [
  AtomStateType<A>,
  (settable: Settable<AtomStateType<A>>) => AtomStateType<A>
] => {
  const instance = useAtomInstanceDynamic(
    atom,
    params as AtomParamsType<A>
  ) as AtomInstanceBase<AtomStateType<A>, any, any>

  const setState =
    instance instanceof AtomInstance
      ? instance.setState
      : instance._stateStore.setState

  return [instance._stateStore.getState(), setState]
}
