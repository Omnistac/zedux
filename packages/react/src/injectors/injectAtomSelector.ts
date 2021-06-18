import { Selector } from '@zedux/core'
import { AtomInstanceStateType, AtomParamsType, AtomStateType } from '../types'
import { injectAtomInstance } from './injectAtomInstance'
import { InjectorType, SelectorInjectorDescriptor, split } from '../utils'
import { injectEcosystem } from './injectEcosystem'
import { Atom, AtomInstance, AtomInstanceBase } from '../classes'

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
    ({ instance: currentInstance }) => {
      const edge = ecosystem._graph.addDependency<AtomInstanceStateType<AI>>(
        currentInstance.keyHash,
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
          currentInstance.keyHash,
          instance.keyHash,
          edge
        )
      }

      const descriptor: SelectorInjectorDescriptor<
        AtomInstanceStateType<AI>
      > = {
        cleanup,
        instance,
        selector,
        selectorResult: selector(instance.store.getState()),
        type: InjectorType.Selector,
      }

      return descriptor
    },
    (prevDescriptor, { instance: currentInstance }) => {
      if (instance !== prevDescriptor.instance) {
        prevDescriptor.cleanup?.()

        const edge = ecosystem._graph.addDependency<AtomInstanceStateType<AI>>(
          currentInstance.keyHash,
          instance.keyHash,
          'injectAtomSelector',
          false,
          false,
          newState => {
            const newResult = prevDescriptor.selector(newState)
            const shouldUpdate = newResult !== prevDescriptor.selectorResult
            prevDescriptor.selectorResult = newResult

            return shouldUpdate
          }
        )

        prevDescriptor.cleanup = () => {
          ecosystem._graph.removeDependency(
            currentInstance.keyHash,
            instance.keyHash,
            edge
          )
        }
        prevDescriptor.instance = instance
      }

      if (prevDescriptor.selector === selector) return prevDescriptor

      const newResult = selector(instance.store.getState())
      prevDescriptor.selectorResult = newResult
      prevDescriptor.selector = selector

      return prevDescriptor
    }
  )

  return selectorResult
}

export const injectAtomSelector: {
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
  ) as AtomInstance<AtomStateType<A>, [...any], any>

  return injectAtomInstanceSelector(instance, selector)
}
