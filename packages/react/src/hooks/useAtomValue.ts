import {
  AnyAtom,
  AnyAtomInstance,
  AtomParamsType,
  AtomStateType,
  ParamlessAtom,
  ZeduxHookConfig,
} from '../types'
import { useAtomInstance } from './useAtomInstance'

export const useAtomValue: {
  <A extends ParamlessAtom>(atom: A): AtomStateType<A>

  <A extends AnyAtom>(
    atom: A,
    params: AtomParamsType<A>,
    config?: Omit<ZeduxHookConfig, 'subscribe'>
  ): AtomStateType<A>

  <AI extends AnyAtomInstance>(
    instance: AI,
    params?: [],
    config?: Omit<ZeduxHookConfig, 'subscribe'>
  ): AtomStateType<AI>
} = <A extends AnyAtom>(
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
