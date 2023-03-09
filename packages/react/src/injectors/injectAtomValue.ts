import {
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomParamsType,
  AtomStateType,
  ParamlessAtom,
} from '../types'
import { injectAtomInstance } from './injectAtomInstance'

export const injectAtomValue: {
  <A extends ParamlessAtom>(atom: A): AtomStateType<A>

  <A extends AnyAtomTemplate>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomStateType<A>

  <I extends AnyAtomInstance>(instance: I): AtomStateType<I>
} = <A extends AnyAtomTemplate>(atom: A, params?: AtomParamsType<A>) => {
  const instance = injectAtomInstance(atom, params as AtomParamsType<A>, {
    operation: 'injectAtomValue',
    subscribe: true,
  })

  return instance.store.getState()
}
