import { Dep, EvaluationReason, GraphEdgeDynamicity } from './types'
import { AtomInstanceBase, Ecosystem } from '../classes'
import {
  AnyAtomBase,
  AnyAtomInstanceBase,
  AtomParamsType,
  AtomSelector,
  AtomStateType,
  Ref,
} from '../types'
import { Selector } from '@zedux/core'

export const runAtomSelector = <T = any>(
  selector: AtomSelector<T>,
  ecosystem: Ecosystem,
  prevDeps: Ref<Record<string, Dep>>,
  prevResult: Ref<T>,
  evaluate: (reasons?: EvaluationReason[]) => void,
  operation: string
) => {
  const deps: Record<string, Dep> = {}
  let isExecuting = true

  const get = <A extends AnyAtomBase>(
    atomOrInstance: A | AnyAtomInstanceBase,
    params?: AtomParamsType<A>
  ) => {
    const instance =
      atomOrInstance instanceof AtomInstanceBase
        ? atomOrInstance
        : ecosystem.getInstance(atomOrInstance, params as AtomParamsType<A>)

    if (isExecuting) {
      deps[instance.keyHash] = {
        instance,
        dynamicity: GraphEdgeDynamicity.Dynamic,
      }
    }

    return instance.store.getState()
  }

  const getInstance = <A extends AnyAtomBase>(
    atomOrInstance: A | AnyAtomInstanceBase,
    params?: AtomParamsType<A>
  ) => {
    const instance = ecosystem.getInstance(
      atomOrInstance as A,
      params as AtomParamsType<A>
    )

    // don't override any dynamic or restricted-dynamic deps on this instance
    if (isExecuting && !deps[instance.keyHash]) {
      deps[instance.keyHash] = {
        instance,
        dynamicity: GraphEdgeDynamicity.Static,
      }
    }

    return instance
  }

  const select = <A extends AnyAtomBase, D>(
    atomOrInstanceOrSelector: A | AnyAtomInstanceBase | AtomSelector<D>,
    paramsOrSelector?: AtomParamsType<A>[] | Selector<AtomStateType<A>, D>,
    selector?: Selector<AtomStateType<A>, D>
  ) => {
    if (typeof atomOrInstanceOrSelector === 'function') {
      return (atomOrInstanceOrSelector as AtomSelector<D>)(getters)
    }

    const params = Array.isArray(paramsOrSelector)
      ? paramsOrSelector
      : ([] as AtomParamsType<A>)

    const resolvedSelector: Selector<AtomStateType<A>, D> =
      typeof paramsOrSelector === 'function'
        ? paramsOrSelector
        : (selector as Selector<AtomStateType<A>, D>)

    const instance = ecosystem.getInstance(
      atomOrInstanceOrSelector as A,
      params as AtomParamsType<A>
    )

    const result = resolvedSelector(instance.store.getState())

    // don't override any dynamic deps on this instance
    if (
      isExecuting &&
      deps[instance.keyHash]?.dynamicity !== GraphEdgeDynamicity.Dynamic
    ) {
      const newDep: Dep = {
        instance,
        dynamicity: GraphEdgeDynamicity.RestrictedDynamic,
        memoizedVal: result,
        shouldUpdate: newState => {
          const newResult = resolvedSelector(newState)

          if (newResult === newDep.memoizedVal) return false

          newDep.memoizedVal = newResult
          return true
        },
      }

      deps[instance.keyHash] = newDep
    }

    return result
  }

  const getters = { ecosystem, get, getInstance, select }
  const selectorResult = selector(getters)
  isExecuting = false

  // clean up any deps that are gone now
  Object.values(prevDeps.current).forEach(prevDep => {
    if (deps[prevDep.instance.keyHash]?.dynamicity === prevDep.dynamicity) {
      return
    }

    prevDep.cleanup?.()
  })

  const newDeps: Record<string, Dep> = {}

  // register new deps
  Object.values(deps).forEach(dep => {
    const prevDep = prevDeps.current[dep.instance.keyHash]

    // check for instance ref match in case of instance force-destruction (hmm
    // TODO: this may need to happen in more places)
    if (
      prevDep?.instance === dep.instance &&
      prevDep?.dynamicity === dep.dynamicity
    ) {
      newDeps[dep.instance.keyHash] = prevDep
      return
    }

    dep.cleanup = ecosystem._graph.registerExternalDependent(
      dep.instance,
      (signal, newState, reasons) => {
        const needsUpdate =
          dep.dynamicity !== GraphEdgeDynamicity.RestrictedDynamic ||
          dep.shouldUpdate?.(newState)

        if (!needsUpdate) return

        // Don't need to specifically handle GraphEdgeSignal.Destroyed -
        // re-running the selector will re-create the instance if needed.
        const newResult = runAtomSelector(
          selector,
          ecosystem,
          prevDeps,
          prevResult,
          evaluate,
          operation
        )

        // Only evaluate if the selector result changes
        if (newResult === prevResult.current) return

        prevResult.current = newResult
        evaluate(reasons)
      },
      operation,
      dep.dynamicity === GraphEdgeDynamicity.Static
    )

    newDeps[dep.instance.keyHash] = dep
  })

  prevDeps.current = newDeps

  return selectorResult
}
