import {
  AtomSelectorConfig,
  AtomSelectorOrConfig,
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
  const storage =
    (render as any).storage || (selectors._storage[dependentKey] ||= {})

  const existingCache = storage.cache as SelectorCache<T, Args> | undefined

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
  const cache = selectors.getCache(selectorOrConfig, resolvedArgs)
  const renderedResult = cache.result

  if (cache !== existingCache) {
    if (existingCache) {
      // yes, remove this during render
      _graph.removeEdge(dependentKey, existingCache.id)
    }

    storage.cache = cache as SelectorCache<any, any[]>
  }

  // When an inline selector returns a referentially unstable result every run,
  // we have to ignore the subsequent update. Do that using a "state machine"
  // that goes from 0 -> 1 -> 2. This machine ensures that the ignored update
  // occurs after the component rerenders and the effect reruns after that
  // render. This works with strict mode on or off. Use the stable `render`
  // function as a "ref" :O
  if (storage.ignorePhase === 1) {
    storage.ignorePhase = 2
  }

  let cancelCleanup = false

  useEffect(() => {
    cancelCleanup = true
    delete selectors._storage[dependentKey]
    ;(render as any).storage = storage

    // re-get the cache in case an unmounting component's effect cleanup
    // destroyed it before we could add this dependent
    const newCache = selectors.getCache(selectorOrConfig, resolvedArgs)

    const cleanup = () => {
      if (cancelCleanup) {
        cancelCleanup = false

        return
      }

      if (storage.ignorePhase !== 1) {
        delete selectors._storage[dependentKey]

        queueMicrotask(() => {
          _graph.removeEdge(dependentKey, newCache.id)
        })
      }
    }

    // Make this function idempotent to guard against React's double-invocation
    if (_graph.nodes[newCache.id]?.dependents.get(dependentKey)) {
      return cleanup
    }

    _graph.addEdge(dependentKey, newCache.id, OPERATION, External, () =>
      render({})
    )

    // an unmounting component's effect cleanup can force-destroy the selector
    // or update its dependencies before this component is mounted. If that
    // happened, trigger a rerender to recache the selector and/or get its new
    // result. On the rerender, ignore changes
    if (newCache.result !== renderedResult && !storage.ignorePhase) {
      storage.ignorePhase = 1
      render({})
    }

    if (storage.ignorePhase === 2) {
      storage.ignorePhase = 0
    }

    // React StrictMode's double renders can wreak havoc on the selector cache.
    // Clean up havoc
    queueMicrotask(() => {
      cancelCleanup = false

      Object.values(selectors._storage).forEach(storageItem => {
        if (storageItem.cache?.id) {
          selectors._destroySelector(storageItem.cache.id)
        }
      })
    })

    return cleanup
  }, [cache])

  return renderedResult as T
}
