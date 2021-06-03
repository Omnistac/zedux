import { AtomBase, AtomInstanceBase } from '../classes'
import { AtomParamsType, AtomStateType } from '../types'
import { injectAtomInstanceDynamic } from './injectAtomInstanceDynamic'

export const injectAtomValue: {
  <A extends AtomBase<any, [], any>>(atom: A): AtomStateType<A>
  <A extends AtomBase<any, any, any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomStateType<A>
} = <A extends AtomBase<any, any, any>>(
  atom: A,
  params?: AtomParamsType<A>
) => {
  const instance = injectAtomInstanceDynamic(
    atom,
    params as AtomParamsType<A>,
    'injectAtomValue'
  ) as AtomInstanceBase<AtomStateType<A>, any, any>

  return instance._stateStore.getState()
}
