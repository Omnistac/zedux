import { Dep, EvaluationReason, GraphEdgeDynamicity } from './types'
import { Ecosystem } from '../classes'
import {
  AnyAtomBase,
  AnyAtomInstanceBase,
  AtomGetters,
  AtomParamsType,
  AtomSelector,
  AtomSelectorConfig,
  AtomSelectorOrConfig,
  AtomStateType,
  Ref,
} from '../types'
import { Selector } from '@zedux/core'

const defaultArgsAreEqual = (newArgs: any[], prevArgs: any[]) =>
  newArgs.length === prevArgs.length &&
  newArgs.every((val, i) => val === prevArgs[i])

const defaultResultsAreEqual = (a: any, b: any) => a === b

const defaultUpdateDeps = (updater: () => void) => updater()

export const runAtomSelector = <T = any, Args extends any[] = []>(
  selectorOrConfig: AtomSelectorOrConfig<T, Args>,
  args: Args,
  ecosystem: Ecosystem,
  prevArgs: Ref<Args | undefined>,
  prevDeps: Ref<Record<string, Dep>>,
  prevResult: Ref<T | undefined>,
  prevSelector: Ref<AtomSelector<T, Args> | undefined>,
  evaluate: (reasons?: EvaluationReason[]) => void,
  operation: string,
  id: string,
  tryToShortCircuit: boolean,
  updateDeps = defaultUpdateDeps
) => {
  const config = (selectorOrConfig as unknown) as AtomSelectorConfig<T, Args>
  const selector =
    typeof selectorOrConfig === 'function'
      ? selectorOrConfig
      : selectorOrConfig.selector

  const resultsAreEqual = config.resultsAreEqual || defaultResultsAreEqual

  // only try short-circuiting if this isn't the first run
  if (tryToShortCircuit) {
    // short-circuit if user supplied argsAreEqual and args are the same
    if (config.argsAreEqual) {
      if (config.argsAreEqual(args, prevArgs.current as Args)) {
        return prevResult.current as T
      }
    } else {
      // user didn't supply argsAreEqual: Short-circuit if args and prevSelector
      // are the same
      if (
        defaultArgsAreEqual(args, prevArgs.current as Args) &&
        selector === prevSelector.current
      ) {
        return prevResult.current as T
      }
    }
  }

  // we couldn't short-circuit. Update refs
  prevArgs.current = args
  prevSelector.current = selector

  const deps: Record<string, Dep> = {}
  let isExecuting = true

  const get = <A extends AnyAtomBase>(
    atomOrInstance: A | AnyAtomInstanceBase,
    params?: AtomParamsType<A>
  ) => {
    const instance = ecosystem.getInstance(
      atomOrInstance as A,
      params as AtomParamsType<A>
    )

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
    atomOrInstanceOrSelector: A | AnyAtomInstanceBase | AtomSelectorOrConfig<D>,
    paramsOrSelector?: AtomParamsType<A>[] | Selector<AtomStateType<A>, D>,
    selector?: Selector<AtomStateType<A>, D>,
    ...rest: any[]
  ) => {
    if (
      typeof atomOrInstanceOrSelector === 'function' ||
      'selector' in atomOrInstanceOrSelector
    ) {
      // we throw away any atom selector config in nested selects
      const resolvedSelector =
        typeof atomOrInstanceOrSelector === 'function'
          ? atomOrInstanceOrSelector
          : atomOrInstanceOrSelector.selector

      return (resolvedSelector as any)(
        getters,
        paramsOrSelector,
        selector,
        ...rest
      )
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

  const getters: AtomGetters = { ecosystem, get, getInstance, select }
  const selectorResult = selector(getters, ...args)
  isExecuting = false

  updateDeps(() => {
    // clean up any deps that are gone now
    Object.values(prevDeps.current).forEach(prevDep => {
      const dep = deps[prevDep.instance.keyHash]

      // don't cleanup if nothing's changed; we'll copy the old dep to the new
      // deps. Check for instance ref match in case of instance force-destruction
      if (
        dep.instance === prevDep.instance &&
        dep?.dynamicity === prevDep.dynamicity
      ) {
        return
      }

      prevDep.cleanup?.()
    })

    const newDeps: Record<string, Dep> = {}

    // register new deps
    Object.values(deps).forEach(dep => {
      const prevDep = prevDeps.current[dep.instance.keyHash]

      // don't create a new edge if nothing's changed; copy the old dep to the new
      // deps. Check for instance ref match in case of instance force-destruction
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

          // we don't need to defer running this on GraphEdgeSignal.Destroyed
          // 'cause this callback already schedules an UpdateExternalDependent
          // job that will defer execution until after the instance is fully
          // destroyed
          const newResult = runAtomSelector(
            selectorOrConfig,
            prevArgs.current as Args,
            ecosystem,
            prevArgs,
            prevDeps,
            prevResult,
            prevSelector,
            evaluate,
            operation,
            id,
            false // short-circuit not possible if a dep changed
          )

          // Only evaluate if the selector result changes
          if (resultsAreEqual(newResult, prevResult.current as T)) return

          prevResult.current = newResult
          evaluate(reasons)
        },
        operation,
        dep.dynamicity === GraphEdgeDynamicity.Static,
        false,
        true,
        id
      )

      newDeps[dep.instance.keyHash] = dep
    })

    prevDeps.current = newDeps
  })

  return selectorResult
}
