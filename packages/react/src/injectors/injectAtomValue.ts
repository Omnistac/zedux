import { AtomBase, AtomInstanceBase } from '../classes'
import { AtomParamsType, AtomStateType } from '../types'
import { injectAtomInstance } from './injectAtomInstance'

export const injectAtomValue: {
  <A extends AtomBase<any, [], any, any, any, any>>(atom: A): AtomStateType<A>

  <A extends AtomBase<any, [...any], any, any, any, any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomStateType<A>

  <AI extends AtomInstanceBase<any, [...any], any>>(
    instance: AI
  ): AtomStateType<AI>
} = <A extends AtomBase<any, [...any], any, any, any, any>>(
  atom: A,
  params?: AtomParamsType<A>
) => {
  const instance = injectAtomInstance(atom, params as AtomParamsType<A>, {
    operation: 'injectAtomValue',
    subscribe: true,
  }) as AtomInstanceBase<AtomStateType<A>, [...any], any>

  return instance.store.getState()
}
