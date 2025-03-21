import { Ecosystem } from '@zedux/atoms'
import React, { useId } from 'react'

type MaybeComponent =
  | {
      displayName?: string
      name?: string
    }
  | undefined

type React18 = {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?: {
    ReactCurrentOwner?: {
      current?: {
        type?: MaybeComponent
      }
    }
  }
}

type React19 = {
  __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?: {
    A?: {
      getOwner?: () => {
        type?: MaybeComponent
      }
    }
  }

  __SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?: {
    A?: {
      getOwner?: () => {
        type?: MaybeComponent
      }
    }
  }
}

const react19KeyBase =
  '_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE' as const
const clientKey = `__CLIENT${react19KeyBase}` as const
const serverKey = `__SERVER${react19KeyBase}` as const

/**
 * Get a unique id for a Zedux hook call. This id is predictable - it should be
 * exactly the same every time a given component renders in the same place in
 * the component tree. This means it persists across SSR and component
 * destruction/recreation which happens a lot e.g. during suspense.
 *
 * This uses the forbidden React internals object. We only use it to get a
 * dev-friendly name for the React component's node in the atom graph. It's fine
 * if React changes their internals - we'll fall back to the string "unknown".
 * We have no need to "warn users they cannot upgrade" 'cause they can at the
 * cost of some DX.
 */
export const useReactComponentId = (ecosystem: Ecosystem) => {
  const component: MaybeComponent =
    (
      (React as React19)[clientKey] ?? (React as React19)[serverKey]
    )?.A?.getOwner?.()?.type ??
    (React as React18).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
      ?.ReactCurrentOwner?.current?.type

  const name = component?.displayName || component?.name
  const id = useId()

  return ecosystem.makeId('component', name || 'unknown', `-${id}`)
}
