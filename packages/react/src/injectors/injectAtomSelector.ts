import { Selector } from '@zedux/core'
import {
  AtomInstanceStateType,
  AtomParamsType,
  AtomSelector,
  AtomStateType,
} from '../types'
import { injectAtomInstance } from './injectAtomInstance'
import {
  Dep,
  EvaluationTargetType,
  EvaluationType,
  InjectorType,
  SelectorInjectorDescriptor,
  split,
} from '../utils'
import { injectEcosystem } from './injectEcosystem'
import { Atom, AtomInstance, AtomInstanceBase } from '../classes'
import { diContext } from '../utils/csContexts'
import { runAtomSelector } from '../utils/runAtomSelector'
import { injectEffect } from './injectEffect'
import { injectRef } from './injectRef'

const OPERATION = 'injectAtomSelector'

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

const injectStandaloneSelector = <T>(selector: AtomSelector<T>) => {
  const { instance } = diContext.consume()
  const prevDeps = injectRef<Record<string, Dep>>({})
  const prevResult = injectRef<T>()
  const selectorRef = injectRef<typeof selector>() // don't populate initially

  const cachedPrevResult = prevResult.current
  const result =
    selector === selectorRef.current
      ? prevResult.current
      : runAtomSelector(
          selector,
          instance.ecosystem,
          prevDeps,
          prevResult,
          reasons =>
            instance._scheduleEvaluation({
              newState: prevResult.current, // runAtomSelector updates this ref before calling this callback
              oldState: cachedPrevResult,
              operation: OPERATION,
              reasons,
              targetType: EvaluationTargetType.Injector,
              type: EvaluationType.StateChanged,
            }),
          OPERATION
        )

  prevResult.current = result
  selectorRef.current = selector

  // Final cleanup on unmount
  injectEffect(
    () => () => {
      Object.values(prevDeps.current).forEach(dep => {
        dep.cleanup?.()
      })
    },
    []
  )

  return result
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

  <T>(selector: AtomSelector<T>): T
} = <A extends Atom<any, [...any], any>, D = any>(
  atom: A | AtomInstance<any, [...any], any> | AtomSelector<any>,
  paramsArg?: AtomParamsType<A> | Selector<AtomStateType<A>, D>,
  selectorArg?: Selector<AtomStateType<A>, D>
): D => {
  if (typeof atom === 'function') {
    // yes, this breaks the rules of injectors
    return injectStandaloneSelector(atom)
  }

  const params = selectorArg
    ? (paramsArg as AtomParamsType<A>)
    : (([] as unknown) as AtomParamsType<A>)

  const selector = selectorArg || (paramsArg as Selector<AtomStateType<A>, D>)

  const instance = injectAtomInstance(
    atom as A,
    params,
    'injectAtomSelector',
    false
  ) as AtomInstance<AtomStateType<A>, [...any], any>

  return injectAtomInstanceSelector(instance, selector)
}
