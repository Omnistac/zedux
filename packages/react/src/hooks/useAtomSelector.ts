import {
  AtomSelectorConfig,
  AtomSelectorOrConfig,
  DependentEdge,
  haveDepsChanged,
  SelectorCache,
} from '@zedux/atoms'
import { useEffect, useState } from 'react'
import { External } from '../utils'
import { useEcosystem } from './useEcosystem'
import { useReactComponentId } from './useReactComponentId'

const OPERATION = 'useAtomSelector'

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
  const { _graph, selectors } = ecosystem
  const dependentKey = useReactComponentId()
  const [, render] = useState<undefined | object>()

  const existingCache = (render as any).cache as
    | SelectorCache<T, Args>
    | undefined

  const argsChanged =
    !existingCache ||
    ((selectorOrConfig as AtomSelectorConfig<T, Args>).argsComparator
      ? !(
          (selectorOrConfig as AtomSelectorConfig<T, Args>).argsComparator as (
            newArgs: Args,
            oldArgs: Args
          ) => boolean
        )(args, existingCache.args || ([] as unknown as Args))
      : haveDepsChanged(existingCache.args, args))

  const resolvedArgs = argsChanged ? args : (existingCache.args as Args)

  // if the refs/args don't match, existingCache has refCount: 1, there is no
  // cache yet for the new ref, and the new ref has the same name, assume it's
  // an inline selector
  const isSwappingRefs =
    existingCache &&
    existingCache.selectorRef !== selectorOrConfig &&
    !argsChanged
      ? _graph.nodes[existingCache.id]?.refCount === 1 &&
        !selectors._refBaseKeys.has(selectorOrConfig) &&
        selectors._getIdealCacheId(existingCache.selectorRef) ===
          selectors._getIdealCacheId(selectorOrConfig)
      : false

  if (isSwappingRefs) {
    // switch `mounted` to false temporarily to prevent circular rerenders
    ;(render as any).mounted = false
    selectors._swapRefs(
      existingCache as SelectorCache<any, any[]>,
      selectorOrConfig as AtomSelectorOrConfig<any, any[]>,
      resolvedArgs
    )
    ;(render as any).mounted = true
  }

  let cache = isSwappingRefs
    ? (existingCache as SelectorCache<T, Args>)
    : selectors.getCache(selectorOrConfig, resolvedArgs)

  let edge: DependentEdge | undefined

  const addEdge = () => {
    if (!_graph.nodes[cache.id]?.dependents.get(dependentKey)) {
      edge = _graph.addEdge(dependentKey, cache.id, OPERATION, External, () => {
        if ((render as any).mounted) render({})
      })

      if (edge) {
        edge.dependentKey = dependentKey

        if (cache._lastEdge) {
          edge.prevEdge = cache._lastEdge
        }
        cache._lastEdge = new WeakRef(edge)
      }

      if (selectors._lastCache && selectors._lastCache.deref() !== cache) {
        cache._prevCache = selectors._lastCache
      }

      selectors._lastCache = new WeakRef(cache)
    }
  }

  // Yes, subscribe during render. This operation is idempotent.
  addEdge()

  const renderedResult = cache.result
  ;(render as any).cache = cache as SelectorCache<any, any[]>

  useEffect(() => {
    cache = isSwappingRefs
      ? (existingCache as SelectorCache<T, Args>)
      : selectors.getCache(selectorOrConfig, resolvedArgs)

    if (edge) {
      let prevEdge = edge.prevEdge?.deref()

      // clear out any junk edges added by StrictMode
      while (prevEdge && !prevEdge.isMaterialized) {
        ecosystem._graph.removeEdge(prevEdge.dependentKey!, cache.id)
        prevEdge = prevEdge.prevEdge?.deref()
      }

      edge.isMaterialized = true
    }

    let prevCache = cache._prevCache?.deref()

    // clear out any junk caches created by StrictMode
    while (prevCache && !prevCache.isMaterialized) {
      selectors.destroyCache(prevCache, [], true)
      prevCache = prevCache._prevCache?.deref()
    }

    cache.isMaterialized = true

    // Try adding the edge again (will be a no-op unless React's StrictMode ran
    // this effect's cleanup unnecessarily)
    addEdge()

    // use the referentially stable render function as a ref :O
    ;(render as any).mounted = true

    // an unmounting component's effect cleanup can force-destroy the selector
    // or update the state of its dependencies (causing it to rerun) before we
    // set `render.mounted`. If that happened, trigger a rerender to recreate
    // the selector and/or get its new state
    if (cache.isDestroyed || cache.result !== renderedResult) {
      render({})
    }

    return () => {
      // remove the edge immediately - no need for a delay here. When StrictMode
      // double-invokes (invokes, then cleans up, then re-invokes) this effect,
      // it's expected that selectors and `ttl: 0` atoms with no other
      // dependents get destroyed and recreated - that's part of what StrictMode
      // is ensuring
      _graph.removeEdge(dependentKey, cache.id)
      // no need to set `render.mounted` to false here
    }
  }, [cache.id])

  return renderedResult as T
}
