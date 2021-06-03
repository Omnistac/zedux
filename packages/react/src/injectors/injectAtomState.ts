import { Settable } from '@zedux/core'
import { AtomBase, AtomInstance, AtomInstanceBase } from '../classes'
import { AtomInstanceStateType, AtomParamsType, AtomStateType } from '../types'
import { injectAtomInstanceDynamic } from './injectAtomInstanceDynamic'

export const injectAtomState: {
  <A extends AtomBase<any, [], any>>(atom: A): [
    AtomStateType<A>,
    (settable: Settable<AtomStateType<A>>) => AtomStateType<A>
  ]

  <A extends AtomBase<any, any, any>>(atom: A, params: AtomParamsType<A>): [
    AtomStateType<A>,
    (settable: Settable<AtomStateType<A>>) => AtomStateType<A>
  ]

  <AI extends AtomInstanceBase<any, any, any>>(
    instance: AI | AtomBase<any, any, any>,
    params?: []
  ): [
    AtomInstanceStateType<AI>,
    (settable: Settable<AtomInstanceStateType<AI>>) => AtomInstanceStateType<AI>
  ]
} = <A extends AtomBase<any, any, any>>(
  atom: A | AtomInstanceBase<any, any, any>,
  params?: AtomParamsType<A>
): [
  AtomStateType<A>,
  (settable: Settable<AtomStateType<A>>) => AtomStateType<A>
] => {
  const instance = injectAtomInstanceDynamic(
    atom,
    params as AtomParamsType<A>,
    'injectAtomState'
  ) as AtomInstanceBase<AtomStateType<A>, any, any>

  const setState =
    instance instanceof AtomInstance
      ? instance.setState
      : instance._stateStore.setState

  return [instance._stateStore.getState(), setState]
}
