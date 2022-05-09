import { AtomSelectorOrConfig, EdgeFlag } from '../types'
import { useMemo, useRef, useSyncExternalStore } from 'react'
import { AtomSelectorCache, haveDepsChanged } from '../utils'
import { useEcosystem } from './useEcosystem'

const OPERATION = 'useAtomSelector'

export const useAtomSelector = <T, Args extends any[]>(
  selectorOrConfig: AtomSelectorOrConfig<T, Args>,
  ...args: Args
): T => {
  const ecosystem = useEcosystem()

  // would be nice if React provided some way to know that multiple hooks are
  // from the same component. For now, every Zedux hook usage creates a new
  // graph node
  const dependentKey = useMemo(
    () => ecosystem._idGenerator.generateReactComponentId(),
    []
  )
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
        const [cacheKey, cache] = ecosystem._selectorCache.getCacheAndKey(
          selectorOrConfig,
          resolvedArgs
        )
        cacheRef.current = cache

        ecosystem._graph.addEdge(
          dependentKey,
          cacheKey,
          OPERATION,
          EdgeFlag.External,
          onStoreChange
        )

        return () => {
          // I don't think we need to unset the cacheKey ref here
          ecosystem._graph.removeEdge(dependentKey, cacheKey)
        }
      },
      () => cacheRef.current?.result as T,
    ],
    [ecosystem, resolvedArgs, selectorOrConfig]
  )

  return useSyncExternalStore(subscribe, getSnapshot)
}
