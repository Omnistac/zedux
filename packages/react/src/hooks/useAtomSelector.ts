import {
  AtomSelectorConfig,
  AtomSelectorOrConfig,
  haveDepsChanged,
} from '@zedux/atoms'
import { useEffect, useRef, useState } from 'react'
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
  const cacheRef = useRef<{ args: Args }>()
  const [, render] = useState<undefined | object>()

  const existingCache =
    cacheRef.current || selectors.find(selectorOrConfig, args)

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
  const renderedResult = ecosystem.select(selectorOrConfig, ...resolvedArgs)

  useEffect(() => {
    // Don't cache the selector until this effect runs. Sadly, this means that
    // all selectors that are first invoked from React will be double-invoked.
    // There's really nothing (performant and good) that we can do about this.
    // React is really just missing lots of features for external stores.
    const cache = selectors.getCache(selectorOrConfig, resolvedArgs)

    if (_graph.nodes[cache.id]?.dependents.get(dependentKey)) return

    _graph.addEdge(dependentKey, cache.id, OPERATION, External, () =>
      render({})
    )

    // an unmounting component's effect cleanup can force-destroy the selector
    // or update its dependencies before this component is mounted. If that
    // happened, trigger a rerender to recache the selector and/or get its new
    // result
    if (cache.result !== renderedResult) render({})

    // use the referentially stable render function as a ref :O
    // ;(render as any).mounted = true
    cacheRef.current = { args: resolvedArgs }

    return () => _graph.removeEdge(dependentKey, cache.id)
  }, [selectorOrConfig, resolvedArgs])

  return renderedResult
}
