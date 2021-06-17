import { Atom, AtomInstance } from '../classes'
import { AtomInstanceStateType, AtomParamsType, AtomStateType } from '../types'
import { useAtomInstanceDynamic } from './useAtomInstanceDynamic'

export const useAtomValue: {
  <A extends Atom<any, [], any>>(atom: A): AtomStateType<A>

  <A extends Atom<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomStateType<A>

  <AI extends AtomInstance<any, [...any], any, any>>(
    instance: AI
  ): AtomInstanceStateType<AI>
} = <A extends Atom<any, [...any], any>>(
  atom: A,
  params?: AtomParamsType<A>
) => {
  const instance = useAtomInstanceDynamic(
    atom,
    params as AtomParamsType<A>
  ) as AtomInstance<AtomStateType<A>, [...any], any, any>

  return instance.store.getState()
}
