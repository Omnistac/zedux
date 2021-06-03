import { AtomInstanceBase } from '../classes'
import { AtomInstanceStateType } from '../types'
import { InjectorType, SelectorInjectorDescriptor, split } from '../utils'
import { injectEcosystem } from './injectEcosystem'

export const injectAtomInstanceSelector = <
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
    'injectAtomInstanceSelector',
    InjectorType.Selector,
    ({ instance }) => {
      const edge = ecosystem._graph.addDependency<AtomInstanceStateType<AI>>(
        instance.keyHash,
        instance.keyHash,
        'injectAtomInstanceSelector',
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
