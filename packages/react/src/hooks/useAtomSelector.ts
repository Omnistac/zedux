import { AtomSelectorOrConfig, EdgeFlag } from '../types'
import { useMemo, useRef, useSyncExternalStore } from 'react'
import { AtomSelectorCache, haveDepsChanged } from '../utils'
import { useEcosystem } from './useEcosystem'
import { useReactComponentId } from './useReactComponentId'

const OPERATION = 'useAtomSelector'

export const useAtomSelector = <T, Args extends any[]>(
  selectorOrConfig: AtomSelectorOrConfig<T, Args>,
  ...args: Args
): T => {
  const ecosystem = useEcosystem()
  const dependentKey = useReactComponentId()
  const cacheRef = useRef<AtomSelectorCache<T, Args>>()

  const resolvedArgs = (
    typeof selectorOrConfig === 'function' ||
    !selectorOrConfig.argsComparator ||
    !cacheRef.current?.args
      ? haveDepsChanged(cacheRef.current?.args, args)
      : selectorOrConfig.argsComparator(args, cacheRef.current.args)
  )
    ? args
    : cacheRef.current?.args || (([] as unknown) as Args)

  const [subscribe, getSnapshot] = useMemo(
    () => [
      (onStoreChange: () => void) => {
        const cache = ecosystem._selectorCache.getCache(
          selectorOrConfig,
          resolvedArgs
        )
        cacheRef.current = cache

        // stupid React 18 forcing this function to be idempotent...
        if (
          !ecosystem._graph.nodes[dependentKey]?.dependencies[cache.cacheKey]
        ) {
          ecosystem._graph.addEdge(
            dependentKey,
            cache.cacheKey,
            OPERATION,
            EdgeFlag.External,
            onStoreChange
          )
        }

        return () => {
          // I don't think we need to unset the cacheKey ref here
          ecosystem._graph.removeEdge(dependentKey, cache.cacheKey)
        }
      },
      () =>
        ecosystem._selectorCache.getCache(selectorOrConfig, resolvedArgs)
          .result as T,
    ],
    [ecosystem, resolvedArgs, selectorOrConfig]
  )

  return useSyncExternalStore(subscribe, getSnapshot)
}
