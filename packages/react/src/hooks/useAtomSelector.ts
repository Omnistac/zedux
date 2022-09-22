import { AtomSelectorConfig, AtomSelectorOrConfig, EdgeFlag } from '../types'
import { MutableRefObject, useMemo, useRef, useSyncExternalStore } from 'react'
import { AtomSelectorCache, haveDepsChanged } from '../utils'
import { useEcosystem } from './useEcosystem'
import { useReactComponentId } from './useReactComponentId'
import { Ecosystem } from '../classes'

const glob = ((typeof globalThis !== 'undefined' && globalThis) || {}) as any
const OPERATION = 'useAtomSelector'
let isSwappingRefs = false

/**
 * If we detect an inline selector using these not-exactly-cheap checks, we can
 * prevent the graph from changing by swapping out its reference and
 * invalidating the cache. It's unfortunately probably not a good trade-off
 * performance-wise, but it's necessary to prevent React's render-loop-of-death
 * in `useSyncExternalStore` when both the subscribe reference and the selector
 * result change every render. Simple reproduction:
 *
 * ```tsx
 * // subscribe ref and getSnapshot result ref change every render = death
 * useSyncExternalStore(() => () => {}, () => ({}))
 * ```
 *
 * It's also better dev-X when the graph doesn't change unnecessarily.
 *
 * Inline selectors that haven't _actually_ changed must be exactly the same,
 * stringified. The stringified `resultsComparator` must also be exactly the
 * same. `argsComparator` doesn't matter since it only runs at the hook level.
 *
 * Importantly, an inline selector's graph node must have exactly one dependent
 * too - the React component that called `useAtomSelector(inlineSelector)`.
 */
const isRefDifferent = (
  ecosystem: Ecosystem,
  newSelector: AtomSelectorOrConfig<any, any>,
  cacheRef: MutableRefObject<AtomSelectorCache<any, any> | undefined>
) => {
  if (!cacheRef.current) return true

  const oldSelector = cacheRef.current.selectorRef

  if (newSelector === oldSelector) return false

  const dependents =
    ecosystem._graph.nodes[cacheRef.current.cacheKey]?.dependents

  if (dependents && Object.keys(dependents).length !== 1) return true

  const newIsFunction = typeof newSelector === 'function'
  const oldIsFunction = typeof oldSelector === 'function'

  if (newIsFunction !== oldIsFunction) return true

  const newKey = ecosystem.selectorCache.getIdealCacheKey(newSelector)
  const oldKey = ecosystem.selectorCache.getIdealCacheKey(oldSelector)

  if (newKey !== oldKey) return true

  if (
    !newIsFunction &&
    !oldIsFunction &&
    newSelector.resultsComparator !== oldSelector.resultsComparator
  ) {
    const newResultsComparatorStr =
      newSelector.resultsComparator?.toString() || ''

    const oldResultsComparatorStr =
      oldSelector.resultsComparator?.toString() || ''

    if (newResultsComparatorStr !== oldResultsComparatorStr) return true
  }

  // last thing to compare is the selectors themselves
  if (newIsFunction && oldIsFunction) {
    return newSelector.toString() !== oldSelector.toString()
  }

  // we know they're both objects at this point
  if (
    (newSelector as AtomSelectorConfig).selector ===
    (oldSelector as AtomSelectorConfig).selector
  ) {
    return false
  }

  const newRefStr = (newSelector as AtomSelectorConfig).selector.toString()
  const oldRefStr = (oldSelector as AtomSelectorConfig).selector.toString()

  return newRefStr !== oldRefStr
}

/**
 * Get the result of running an AtomSelector in the current ecosystem.
 *
 * If the exact selector function (or object if it's an AtomSelectorConfig
 * object) reference + params combo has been used in this ecosystem before,
 * return the cached result.
 *
 * Register a dynamic graph dependency between this React component (as a new
 * external node) and the AtomSelector.
 */
export const useAtomSelector = <T, Args extends any[]>(
  selectorOrConfig: AtomSelectorOrConfig<T, Args>,
  ...args: Args
): T => {
  const ecosystem = useEcosystem()
  const dependentKey = useReactComponentId()
  const cacheRef = useRef<AtomSelectorCache<T, Args>>()
  const isConfig = typeof selectorOrConfig !== 'function'

  const argsChanged =
    isConfig && selectorOrConfig.argsComparator && cacheRef.current?.args
      ? selectorOrConfig.argsComparator(args, cacheRef.current.args)
      : haveDepsChanged(cacheRef.current?.args, args)

  const resolvedArgs = argsChanged
    ? args
    : cacheRef.current?.args || (([] as unknown) as Args)

  const hasRefChanged = selectorOrConfig !== cacheRef.current?.selectorRef
  const isDifferent =
    argsChanged || isRefDifferent(ecosystem, selectorOrConfig, cacheRef)

  const cache =
    isDifferent || !cacheRef.current
      ? ecosystem.selectorCache.getCache(selectorOrConfig, resolvedArgs)
      : cacheRef.current

  // yes, this mutation is fine
  cacheRef.current = cache

  const [subscribe, getSnapshot] = useMemo(() => {
    return [
      (onStoreChange: () => void) => {
        // we have to fire an extra update on subscribe in test envs because
        // there's a bug in React (but only in test environments) where
        // useEffects in child components run before useSyncExternalStore
        // subscribe is called in the parent component.
        if (glob.IS_REACT_ACT_ENVIRONMENT) onStoreChange()

        // this function must be idempotent
        if (!ecosystem._graph.nodes[cache.cacheKey]?.dependents[dependentKey]) {
          ecosystem._graph.addEdge(
            dependentKey,
            cache.cacheKey,
            OPERATION,
            EdgeFlag.External,
            signal => {
              if (signal === 'Destroyed') {
                // see comment in useAtomInstanceDynamic about why returning
                // undefined from `getSnapshot` works
                cacheRef.current = undefined
              }

              if (!isSwappingRefs) onStoreChange()
            }
          )
        }

        return () => {
          // I don't think we need to unset any of the cache refs here
          ecosystem._graph.removeEdge(dependentKey, cache.cacheKey)
        }
      },
      () => cacheRef.current?.result as T,
    ]
  }, [ecosystem, cache])

  // if ref changed but is clearly the "same" selector, swap out the ref and
  // invalidate the cache. This would trigger React "Can't update a component
  // while rendering a different component" warnings unless we track that we're
  // doing this. This can only happen if there's exactly one dependent of the
  // selector, so we go ahead and use a global variable for this to avoid making
  // another ref for every selector.
  if (hasRefChanged && !isDifferent && cacheRef.current) {
    isSwappingRefs = true
    ecosystem.selectorCache._swapRefs(
      cacheRef.current.selectorRef as AtomSelectorOrConfig<any, any[]>,
      selectorOrConfig as AtomSelectorOrConfig<any, any[]>,
      resolvedArgs
    )
    isSwappingRefs = false
  }

  return useSyncExternalStore(subscribe, getSnapshot)
}
