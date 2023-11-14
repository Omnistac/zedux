import React, { useId } from 'react'

/**
 * Get a unique id for a Zedux hook call. This id is predictable - it should be
 * exactly the same every time a given component renders in the same place in
 * the component tree. This means it persists across component
 * destruction/recreation which happens a lot e.g. during suspense.
 *
 * This uses the forbidden React internals object. We only use it to get a
 * dev-friendly name for the React component's node in the atom graph. It's fine
 * if React changes their internals - we'll fall back to using a generated node
 * name.
 */
export const useReactComponentId = () => {
  const component:
    | {
        displayName?: string
        name?: string
      }
    | undefined = (React as any)
    .__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentOwner
    ?.current?.type

  const name = component?.displayName || component?.name || 'rc'

  return `${name}-${useId()}`
}
