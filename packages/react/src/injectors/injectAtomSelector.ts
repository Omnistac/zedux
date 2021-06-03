import { Selector } from '@zedux/core'
import { AtomBase, AtomInstanceBase } from '../classes'
import { AtomInstanceStateType, AtomParamsType, AtomStateType } from '../types'
import { injectAtomInstance } from './injectAtomInstance'
import { InjectorType, SelectorInjectorDescriptor, split } from '../utils'
import { injectEcosystem } from './injectEcosystem'

const injectAtomInstanceSelector = <
  AI extends AtomInstanceBase<any, any, any>,
  D extends any = any
>(
  instance: AI,
  selector: (state: AtomInstanceStateType<AI>) => D
) => {
  const ecosystem = injectEcosystem()

  const { selectorResult } = split<
    SelectorInjectorDescriptor<AtomInstanceStateType<AI>, D>
  >(
    'injectAtomSelector',
    InjectorType.Selector,
    ({ instance }) => {
      const edge = ecosystem._graph.addDependency<AtomInstanceStateType<AI>>(
        instance.keyHash,
        instance.keyHash,
        'injectAtomSelector',
        false,
        false,
        newState => {
          const newResult = descriptor.selector(newState)
          const shouldUpdate = newResult !== descriptor.selectorResult
          descriptor.selectorResult = newResult

          return shouldUpdate
        }
      )

      const cleanup = () => {
        ecosystem._graph.removeDependency(
          instance.keyHash,
          instance.keyHash,
          edge
        )
      }

      const descriptor: SelectorInjectorDescriptor<
        AtomInstanceStateType<AI>
      > = {
        cleanup,
        selector,
        selectorResult: selector(instance._stateStore.getState()),
        type: InjectorType.Selector,
      }

      return descriptor
    },
    prevDescriptor => {
      if (prevDescriptor.selector === selector) return prevDescriptor

      const newResult = selector(instance._stateStore.getState())
      prevDescriptor.selectorResult = newResult
      prevDescriptor.selector = selector

      return prevDescriptor
    }
  )

  return selectorResult
}

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

  <AI extends AtomInstanceBase<any, any, any>, D = any>(
    instance: AI | AtomBase<any, any, any>,
    selector: Selector<AtomInstanceStateType<AI>, D>
  ): D

  <AI extends AtomInstanceBase<any, any, any>, D = any>(
    instance: AI | AtomBase<any, any, any>,
    params: [],
    selector: Selector<AtomInstanceStateType<AI>, D>
  ): D
} = <A extends AtomBase<any, any, any>, D = any>(
  atom: A | AtomInstanceBase<any, any, any>,
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
