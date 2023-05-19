import {
  AtomSelectorOrConfig,
  Ecosystem,
  haveDepsChanged,
  SelectorCache,
} from '@zedux/atoms'
import { MutableRefObject, useMemo, useRef } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'
import { destroyed, External } from '../utils'
import { useEcosystem } from './useEcosystem'
import { useReactComponentId } from './useReactComponentId'

const glob = ((typeof globalThis !== 'undefined' && globalThis) || {}) as any
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
 * It's also better dev-X when the graph doesn't change unnecessarily.
 *
 * An inline selector's graph node must have exactly one dependent - the React
 * component that called `useAtomSelector(inlineSelector)`. It will also have
 * the exact same ideal cache id, which we derive from the name of the selector
 * function if possible.
 */
const isRefDifferent = (
  _graph: Ecosystem['_graph'],
  selectors: Ecosystem['selectors'],
  newSelector: AtomSelectorOrConfig<any, any>,
  cacheRef: MutableRefObject<SelectorCache<any, any>>
) => {
  const oldSelector = cacheRef.current.selectorRef
  if (newSelector === oldSelector) return false

  if (_graph.nodes[cacheRef.current.id].refCount !== 1) return true

  const newIsFunction = typeof newSelector === 'function'
  const oldIsFunction = typeof oldSelector === 'function'

  if (newIsFunction !== oldIsFunction) return true

  const newKey = selectors._getIdealCacheId(newSelector)
  const oldKey = selectors._getIdealCacheId(oldSelector)

  // if this last check is false, we're confident enough that it's an inline
  // selector. It isn't a big deal if it isn't; it's just for _ideal_ Dev X
  return newKey !== oldKey
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
  const { _graph, selectors } = useEcosystem()
  const dependentKey = useReactComponentId()
  const cacheRef = useRef<SelectorCache<T, Args>>()
  const skipState = useRef<T>(destroyed as any)
  const isConfig = typeof selectorOrConfig !== 'function'

  const argsChanged =
    isConfig && selectorOrConfig.argsComparator && cacheRef.current?.args
      ? !selectorOrConfig.argsComparator(args, cacheRef.current.args)
      : haveDepsChanged(cacheRef.current?.args, args)

  const resolvedArgs = argsChanged
    ? args
    : // if args haven't changed, cacheRef has to exist. This cast is fine:
      (cacheRef.current as SelectorCache<T, Args>).args

  const hasRefChanged = selectorOrConfig !== cacheRef.current?.selectorRef
  const isDifferent =
    argsChanged ||
    isRefDifferent(
      _graph,
      selectors,
      selectorOrConfig,
      // the argsChanged check guarantees `cacheRef.current` is defined here:
      cacheRef as MutableRefObject<SelectorCache<any, any>>
    )

  if (isDifferent) {
    // yes, this mutation is fine
    cacheRef.current = selectors.getCache(
      selectorOrConfig,
      resolvedArgs as Args
    )
  }

  const cache = cacheRef.current as SelectorCache<T, Args>

  const [subscribe, getSnapshot] = useMemo(() => {
    let isInvalidated = false

    return [
      (onStoreChange: () => void) => {
        // we have to fire an extra update on subscribe in test envs because
        // there's a bug in React (but only in test environments) where
        // useEffects in child components run before useSyncExternalStore
        // subscribe is called in the parent component.
        if (glob.IS_REACT_ACT_ENVIRONMENT) onStoreChange()

        // this function must be idempotent
        if (!_graph.nodes[cache.id]?.dependents.get(dependentKey)) {
          // React can unmount other components before calling this subscribe
          // function but after we got the cache above. Re-get the cache
          // if such unmountings destroyed it in the meantime:
          if (cache.isDestroyed) {
            ;(cacheRef.current as any) = destroyed
            isInvalidated = true

            onStoreChange()

            return () => {} // let the next render register the graph edge
          }

          _graph.addEdge(
            dependentKey,
            cache.id,
            OPERATION,
            External,
            (signal, newState) => {
              if (newState === skipState.current) {
                ;(skipState.current as any) = destroyed
                return
              }

              if (signal === 'Destroyed') {
                // see comment in useAtomInstance about why returning
                // a nonsense value from `getSnapshot` works
                ;(cacheRef.current as any) = destroyed
                isInvalidated = true
              }

              onStoreChange()
            }
          )
        }

        return () => {
          // I don't think we need to unset any of the cache refs here
          _graph.removeEdge(dependentKey, cache.id)
        }
      },
      () => (isInvalidated ? destroyed : cache.result),
    ]
  }, [_graph, cache])

  // if ref changed but is likely the "same" selector, swap out the ref and
  // invalidate the cache
  if (hasRefChanged && !isDifferent) {
    selectors._swapRefs(
      cache.selectorRef as AtomSelectorOrConfig<any, any[]>,
      selectorOrConfig as AtomSelectorOrConfig<any, any[]>,
      resolvedArgs as Args
    )
    // prevent state update loop if new selector ref just returned a new result:
    skipState.current = cache.result as T
  }

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) as T
}
