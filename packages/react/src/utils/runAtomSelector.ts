import { Dep } from './types'
import { Ecosystem } from '../classes'
import {
  AnyAtomBase,
  AnyAtomInstanceBase,
  AtomGetters,
  AtomParamsType,
  AtomSelectorConfig,
  AtomSelectorOrConfig,
  EvaluationReason,
  GraphEdgeDynamicity,
  Ref,
} from '../types'

const defaultArgsComparator = (newArgs: any[], prevArgs: any[]) =>
  newArgs.length === prevArgs.length &&
  newArgs.every((val, i) => val === prevArgs[i])

const defaultResultsComparator = (a: any, b: any) => a === b

const defaultMaterializer = (materializeDeps: () => void) => materializeDeps()

export const runAtomSelector = <T = any, Args extends any[] = []>(
  selectorOrConfig: AtomSelectorOrConfig<T, Args>,
  args: Args,
  ecosystem: Ecosystem,
  prevArgs: Ref<Args | undefined>,
  prevDeps: Ref<Record<string, Dep>>,
  prevResult: Ref<T | undefined>,
  prevSelector: Ref<AtomSelectorOrConfig<T, Args> | undefined>,
  evaluate: (reasons?: EvaluationReason[]) => void,
  operation: string,
  id: string,
  tryToShortCircuit: boolean,
  materializer = defaultMaterializer
) => {
  const config = (selectorOrConfig as unknown) as AtomSelectorConfig<T, Args>
  const selector =
    typeof selectorOrConfig === 'function'
      ? selectorOrConfig
      : selectorOrConfig.selector

  const resultsComparator = config.resultsComparator || defaultResultsComparator

  // only try short-circuiting if this isn't the first run
  if (tryToShortCircuit) {
    // short-circuit if user supplied argsComparator and args are the same
    if (config.argsComparator) {
      if (config.argsComparator(args, prevArgs.current as Args)) {
        return prevResult.current as T
      }
    } else {
      // user didn't supply argsComparator: Short-circuit if args and selector
      // are the same
      if (
        defaultArgsComparator(args, prevArgs.current as Args) &&
        selectorOrConfig === prevSelector.current
      ) {
        return prevResult.current as T
      }
    }
  }

  // we couldn't short-circuit. Update refs
  prevArgs.current = args
  prevSelector.current = selectorOrConfig

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

  const select = <T, Args extends any[]>(
    atomSelector: AtomSelectorOrConfig<T, Args>,
    ...args: any[]
  ) => {
    // we throw away any atom selector config in nested selects
    const resolvedSelector =
      typeof atomSelector === 'function' ? atomSelector : atomSelector.selector

    return (resolvedSelector as any)(getters, ...args)
  }

  const getters: AtomGetters = { ecosystem, get, getInstance, select }
  const selectorResult = selector(getters, ...args)
  isExecuting = false

  // clean up any deps that are gone now
  Object.values(prevDeps.current).forEach(prevDep => {
    const dep = deps[prevDep.instance.keyHash]

    // don't cleanup if nothing's changed; we'll copy the old dep to the new
    // deps. Check for instance ref match in case of instance force-destruction
    if (
      dep?.instance === prevDep.instance &&
      dep.dynamicity === prevDep.dynamicity
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
      prevDep.dynamicity === dep.dynamicity
    ) {
      newDeps[dep.instance.keyHash] = prevDep
      return
    }

    const ghost = ecosystem._graph.registerGhostDependent(
      dep.instance,
      (signal, newState, reasons) => {
        // we don't need to defer running this on GraphEdgeSignal.Destroyed
        // 'cause this callback already schedules an UpdateExternalDependent
        // job that will defer execution until after the instance is fully
        // destroyed
        const newResult = runAtomSelector(
          prevSelector.current as AtomSelectorOrConfig<T, Args>,
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
        if (resultsComparator(newResult, prevResult.current as T)) return

        prevResult.current = newResult
        evaluate(reasons)
      },
      operation,
      dep.dynamicity === GraphEdgeDynamicity.Static,
      false,
      true,
      id
    )

    dep.cleanup = () => ghost.destroy()
    dep.materialize = () => {
      dep.materialize = undefined
      dep.cleanup = ghost.materialize()
    }

    newDeps[dep.instance.keyHash] = dep
  })

  materializer(() => {
    Object.values(newDeps).forEach(dep => {
      dep.materialize?.()
    })
  })

  prevDeps.current = newDeps

  return selectorResult
}
