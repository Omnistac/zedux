import { useMemo } from 'react'
import { useEcosystem } from './useEcosystem'

/**
 * Get a unique id for a Zedux hook call. The exact string doesn't really
 * matter, but try to use an error stack to grab the React component's actual
 * name for a better debugging experience
 */
export const useReactComponentId = () => {
  const ecosystem = useEcosystem()

  // would be nice if React provided some way to know that multiple hooks are
  // from the same component. For now, every Zedux hook usage creates a new
  // graph node
  return useMemo(() => ecosystem._idGenerator.generateReactComponentId(), [
    ecosystem,
  ])
}
