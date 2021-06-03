import { Selector } from '@zedux/core'
import { AtomBase, AtomInstanceBase } from '../classes'
import { AtomParamsType, AtomStateType } from '../types'
import { injectAtomInstanceSelector } from './injectAtomInstanceSelector'
import { injectAtomInstance } from './injectAtomInstance'

export const injectAtomSelector: {
  <A extends AtomBase<any, [], any>, D = any>(
    atom: A,
    selector: Selector<AtomStateType<A>, D>
  ): D

  <A extends AtomBase<any, any, any>, D = any>(
    atom: A,
    params: AtomParamsType<A> | Selector<AtomStateType<A>, D>,
    selector: Selector<AtomStateType<A>, D>
  ): D
} = <A extends AtomBase<any, any, any>, D = any>(
  atom: A,
  paramsArg: AtomParamsType<A> | Selector<AtomStateType<A>, D>,
  selectorArg?: Selector<AtomStateType<A>, D>
): D => {
  const params = selectorArg
    ? (paramsArg as AtomParamsType<A>)
    : (([] as unknown) as AtomParamsType<A>)

  const selector = selectorArg || (paramsArg as Selector<AtomStateType<A>, D>)

  const instance = injectAtomInstance(
    atom,
    params,
    'injectAtomSelector',
    false
  ) as AtomInstanceBase<AtomStateType<A>, any, any>

  return injectAtomInstanceSelector(instance, selector)
}
