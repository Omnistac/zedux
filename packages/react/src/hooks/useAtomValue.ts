import {
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomParamsType,
  AtomStateType,
  ParamlessAtom,
  ZeduxHookConfig,
} from '../types'
import { useAtomInstance } from './useAtomInstance'

export const useAtomValue: {
  <A extends ParamlessAtom>(atom: A): AtomStateType<A>

  <A extends AnyAtomTemplate>(
    atom: A,
    params: AtomParamsType<A>,
    config?: Omit<ZeduxHookConfig, 'subscribe'>
  ): AtomStateType<A>

  <I extends AnyAtomInstance>(
    instance: I,
    params?: [],
    config?: Omit<ZeduxHookConfig, 'subscribe'>
  ): AtomStateType<I>
} = <A extends AnyAtomTemplate>(
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
