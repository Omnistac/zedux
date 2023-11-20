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

  // When an inline selector returns a referentially unstable result every run,
  // we have to ignore the subsequent update. Do that using a "state machine"
  // that goes from 0 -> 1 -> 2. This machine ensures that the ignored update
  // occurs after the component rerenders and the effect reruns after that
  // render. This works with strict mode on or off. Use the stable `render`
  // function as a "ref" :O
  if ((render as any).ignorePhase === 1) {
    ;(render as any).ignorePhase = 2
  }

  useEffect(() => {
    // Don't cache the selector until this effect runs. Sadly, this means that
    // all selectors that are first invoked from React will be double-invoked.
    // There's really nothing (performant and good) that we can do about this.
    // React is really just missing lots of features for external stores.
    const cache = selectors.getCache(selectorOrConfig, resolvedArgs)

    if (_graph.nodes[cache.id]?.dependents.get(dependentKey)) {
      return () => {
        if ((render as any).ignorePhase !== 1) {
          _graph.removeEdge(dependentKey, cache.id)
        }
      }
    }

    _graph.addEdge(dependentKey, cache.id, OPERATION, External, () =>
      render({})
    )

    // an unmounting component's effect cleanup can force-destroy the selector
    // or update its dependencies before this component is mounted. If that
    // happened, trigger a rerender to recache the selector and/or get its new
    // result. On the rerender, ignore changes
    if (cache.result !== renderedResult && !(render as any).ignorePhase) {
      ;(render as any).ignorePhase = 1
      render({})
    }

    if ((render as any).ignorePhase === 2) {
      ;(render as any).ignorePhase = 0
    }

    cacheRef.current = { args: resolvedArgs }

    return () => {
      if ((render as any).ignorePhase !== 1) {
        _graph.removeEdge(dependentKey, cache.id)
      }
    }
  }, [selectorOrConfig, resolvedArgs])

  return renderedResult
}
