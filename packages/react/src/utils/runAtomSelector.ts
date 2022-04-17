import { AtomSelectorCache, Dep } from './types'
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
} from '../types'

const defaultArgsComparator = (newArgs: any[], prevArgs: any[]) =>
  newArgs.length === prevArgs.length &&
  newArgs.every((val, i) => val === prevArgs[i])

const defaultResultsComparator = (a: any, b: any) => a === b

const defaultMaterializer = (materializeDeps: () => void) => materializeDeps()

const isCached = <T, Args extends any[]>(
  cache: AtomSelectorCache<T, Args>,
  selectorOrConfig: AtomSelectorOrConfig<T, Args>,
  args: Args
) => {
  const selector =
    typeof selectorOrConfig === 'function'
      ? selectorOrConfig
      : selectorOrConfig.selector

  // short-circuit if user supplied argsComparator and args are the same
  if ((selectorOrConfig as AtomSelectorConfig<T, Args>).argsComparator) {
    if (
      (selectorOrConfig as AtomSelectorConfig<T, Args>).argsComparator?.(
        args,
        cache.prevArgs as Args
      )
    ) {
      return true
    }
  } else {
    // user didn't supply argsComparator: Short-circuit if args and prevSelector
    // are the same
    if (
      defaultArgsComparator(args, cache.prevArgs as Args) &&
      selector === cache.prevSelector
    ) {
      return true
    }
  }

  return false
}

export const runAtomSelector = <T = any, Args extends any[] = []>(
  selectorOrConfig: AtomSelectorOrConfig<T, Args>,
  args: Args,
  ecosystem: Ecosystem,
  cache: AtomSelectorCache<T, Args>,
  evaluate: (reasons?: EvaluationReason[]) => void,
  operation: string,
  tryToShortCircuit: boolean,
  materializer = defaultMaterializer
) => {
  const selector =
    typeof selectorOrConfig === 'function'
      ? selectorOrConfig
      : selectorOrConfig.selector

  const resultsComparator =
    (selectorOrConfig as AtomSelectorConfig<T, Args>).resultsComparator ||
    defaultResultsComparator

  // only try short-circuiting if this isn't the first run
  if (tryToShortCircuit && isCached(cache, selectorOrConfig, args)) {
    return cache.prevResult as T
  }

  // we couldn't short-circuit. Update refs
  cache.prevArgs = args
  cache.prevSelector = selector

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
    selectorOrConfig: AtomSelectorOrConfig<T, Args>,
    ...args: Args
  ) => {
    // we throw away any atom selector config in nested selects
    const resolvedSelector =
      typeof selectorOrConfig === 'function'
        ? selectorOrConfig
        : selectorOrConfig.selector

    if (!isExecuting) return resolvedSelector(getters, ...args)

    if (!cache.children) cache.children = new Map()

    // look in this run's cache first - in case we've already copied the child
    // cache over - then look in the previous run's cache
    const childCache =
      (cache.children?.get(
        resolvedSelector as AtomSelector<any, any[]>
      ) as AtomSelectorCache<T, Args>) ||
      (cache.prevChildren?.get(
        resolvedSelector as AtomSelector<any, any[]>
      ) as AtomSelectorCache<T, Args>)

    if (childCache && isCached(childCache, selectorOrConfig, args)) {
      cache.children.set(
        resolvedSelector as AtomSelector<any, any[]>,
        childCache as AtomSelectorCache<any, any[]>
      )

      return childCache.prevResult as T
    }

    const result = resolvedSelector(getters, ...args)
    const resultsComparator =
      (selectorOrConfig as AtomSelectorConfig<T, Args>).resultsComparator ||
      defaultResultsComparator

    if (childCache && resultsComparator(result, childCache.prevResult as T)) {
      childCache.prevArgs = args
      cache.children.set(
        resolvedSelector as AtomSelector<any, any[]>,
        childCache as AtomSelectorCache<any, any[]>
      )

      return childCache.prevResult as T
    }

    cache.children.set(resolvedSelector as AtomSelector<any, any[]>, {
      // an id would be nice
      prevArgs: args as any[],
      prevResult: result,
      prevSelector: resolvedSelector as AtomSelector<any, any[]>,
    })

    return result
  }

  if (cache.children) {
    cache.prevChildren = cache.children
    cache.children = undefined // this is set on the fly if needed (in `select`)
  }

  const getters: AtomGetters = { ecosystem, get, getInstance, select }
  const selectorResult = selector(getters, ...args)
  isExecuting = false

  // Maybe it could be useful to see this in devtools though... or could even
  // provide an ecosystem selectorGraphHistory option to turn this on. For now,
  // prevChildren is unused by us after this point so let it be garbage
  // collected.
  cache.prevChildren = undefined

  // clean up any deps that are gone now
  if (cache.prevDeps) {
    Object.values(cache.prevDeps).forEach(prevDep => {
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
  }

  let hasChanges = false
  const newDeps: Record<string, Dep> = {}

  // register new deps
  Object.values(deps).forEach(dep => {
    const prevDep = cache.prevDeps?.[dep.instance.keyHash]

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
        console.log('selector got update!', newState, reasons)
        // we don't need to defer running this on GraphEdgeSignal.Destroyed
        // 'cause this callback already schedules an UpdateExternalDependent
        // job that will defer execution until after the instance is fully
        // destroyed
        const newResult = runAtomSelector(
          selectorOrConfig,
          cache.prevArgs as Args,
          ecosystem,
          cache,
          evaluate,
          operation,
          false // short-circuit not possible if a dep changed
        )

        // Only evaluate if the selector result changes
        if (resultsComparator(newResult, cache.prevResult as T)) return

        cache.prevResult = newResult
        evaluate(reasons)
      },
      operation,
      dep.dynamicity === GraphEdgeDynamicity.Static,
      false,
      true,
      cache.id
    )

    dep.cleanup = () => ghost.destroy()
    dep.materialize = () => {
      dep.materialize = undefined
      dep.cleanup = ghost.materialize()
    }

    hasChanges = true
    newDeps[dep.instance.keyHash] = dep
  })

  if (hasChanges) {
    materializer(() => {
      Object.values(newDeps).forEach(dep => {
        dep.materialize?.()
      })
    })
  }

  cache.prevDeps = newDeps

  return selectorResult
}
