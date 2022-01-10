import { Selector } from '@zedux/core'
import { AtomInstanceStateType, AtomParamsType, AtomStateType } from '../types'
import { Atom, AtomInstance } from '../classes'
import { diContext } from '../utils/csContexts'
import { AtomSelectorOrConfig } from '..'

export const injectAtomSelector: {
  <T, Args extends any[]>(
    selector: AtomSelectorOrConfig<T, Args>,
    ...args: Args
  ): T

  <A extends Atom<any, [], any>, D = any>(
    atom: A,
    selector: Selector<AtomStateType<A>, D>
  ): D

  <A extends Atom<any, [...any], any>, D = any>(
    atom: A,
    params: AtomParamsType<A> | Selector<AtomStateType<A>, D>,
    selector: Selector<AtomStateType<A>, D>
  ): D

  <AI extends AtomInstance<any, [...any], any>, D = any>(
    instance: AI,
    selector: Selector<AtomInstanceStateType<AI>, D>
  ): D
} = <A extends Atom<any, [...any], any>, D = any>(
  atom: A | AtomInstance<any, [...any], any> | AtomSelectorOrConfig<D>,
  paramsArg?: AtomParamsType<A> | Selector<AtomStateType<A>, D>,
  selectorArg?: Selector<AtomStateType<A>, D>,
  ...rest: any[]
): D => {
  const { instance } = diContext.consume()

  return instance.select(
    atom as A,
    paramsArg as AtomParamsType<A>,
    selectorArg as Selector<AtomStateType<A>, D>,
    ...(rest as [])
  )
}
