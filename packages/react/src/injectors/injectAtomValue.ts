import {
  AnyAtom,
  AnyAtomInstance,
  AtomParamsType,
  AtomStateType,
  ParamlessAtom,
} from '../types'
import { injectAtomInstance } from './injectAtomInstance'

export const injectAtomValue: {
  <A extends ParamlessAtom>(atom: A): AtomStateType<A>

  <A extends AnyAtom>(atom: A, params: AtomParamsType<A>): AtomStateType<A>

  <AI extends AnyAtomInstance>(instance: AI): AtomStateType<AI>
} = <A extends AnyAtom>(atom: A, params?: AtomParamsType<A>) => {
  const instance = injectAtomInstance(atom, params as AtomParamsType<A>, {
    operation: 'injectAtomValue',
    subscribe: true,
  })

  return instance.store.getState()
}
