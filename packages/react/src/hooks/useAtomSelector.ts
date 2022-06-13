import { AtomSelectorOrConfig, EdgeFlag } from '../types'
import { MutableRefObject, useMemo, useRef, useSyncExternalStore } from 'react'
import { AtomSelectorCache, haveDepsChanged } from '../utils'
import { useEcosystem } from './useEcosystem'
import { useReactComponentId } from './useReactComponentId'
import { Ecosystem } from '../classes'

const OPERATION = 'useAtomSelector'

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
 * It's also better dev-X when the graph doesn't unnecessarily.
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

  const newResultsComparatorStr = newIsFunction
    ? ''
    : newSelector.resultsComparator?.toString() || ''

  const oldResultsComparatorStr = oldIsFunction
    ? ''
    : oldSelector.resultsComparator?.toString() || ''

  if (newResultsComparatorStr !== oldResultsComparatorStr) return true

  const newRefStr = newIsFunction
    ? newSelector.toString()
    : newSelector.selector.toString()

  const oldRefStr = oldIsFunction
    ? oldSelector.toString()
    : oldSelector.selector.toString()

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

  const [subscribe, getSnapshot] = useMemo(() => {
    let localCache: T
    let pendingCache: AtomSelectorCache<T, Args> | undefined

    return [
      (onStoreChange: () => void) => {
        const cache = ecosystem.selectorCache.getCache(
          selectorOrConfig,
          resolvedArgs
        )
        pendingCache = cache

        // this function must be idempotent
        if (!ecosystem._graph.nodes[cache.cacheKey]?.dependents[dependentKey]) {
          ecosystem._graph.addEdge(
            dependentKey,
            cache.cacheKey,
            OPERATION,
            EdgeFlag.External,
            onStoreChange
          )
        }

        return () => {
          // I don't think we need to unset any of the cache refs here
          ecosystem._graph.removeEdge(dependentKey, cache.cacheKey)
        }
      },
      () => {
        if (pendingCache) {
          cacheRef.current = pendingCache
          pendingCache = undefined
        } else if (cacheRef.current) {
          return cacheRef.current.result as T
        }

        // React designed `useSyncExternalStore` for Redux, which is just sooo
        // unfortunate for us. This means they call `getSnapshot` before
        // `subscribe` which .. just ..... :angry: (they in fact wait until the
        // component renders fully without suspending. I suppose they think
        // `subscribe` is too expensive to call _and_ clean up every suspended
        // render? In our case, it's really no more expensive than calling
        // `getSnapshot` and so much less convenient. So yeah :angry:)
        return (
          localCache ||
          (localCache = ecosystem.select(selectorOrConfig, ...resolvedArgs))
        )
      },
    ]
  }, [
    ecosystem,
    resolvedArgs,
    isDifferent && cacheRef.current ? selectorOrConfig : cacheRef, // not `.current?.selectorRef`
  ])

  // if ref changed but is clearly the "same" selector, swap out the ref and
  // invalidate the cache
  if (hasRefChanged && !isDifferent && cacheRef.current) {
    cacheRef.current.selectorRef = selectorOrConfig
    ecosystem.selectorCache.invalidateCache(selectorOrConfig, resolvedArgs)
  }

  return useSyncExternalStore(subscribe, getSnapshot)
}
