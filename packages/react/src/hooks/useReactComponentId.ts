import React, { useMemo } from 'react'
import { useEcosystem } from './useEcosystem'

/**
 * Get a unique id for a Zedux hook call. The exact string doesn't really
 * matter, but in dev try to use an error stack to grab the React component's
 * actual name for a better debugging experience
 */
export const useReactComponentId = () => {
  const ecosystem = useEcosystem()

  // would be nice if React provided some way to know that multiple hooks are
  // from the same component instance. For now, every Zedux hook usage creates a
  // new graph node
  return useMemo(
    () =>
      ecosystem._idGenerator.generateReactComponentId(
        // Yes. Fire me. Seriously though, why doesn't React expose the current
        // component in a way that won't get me fired. Surely Recoil and Zedux
        // aren't the only ones to run into this.
        (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
          .ReactCurrentOwner.current.type
      ),
    [ecosystem]
  )
}
