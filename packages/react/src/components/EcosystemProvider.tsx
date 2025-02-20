import { createEcosystem, Ecosystem, EcosystemConfig } from '@zedux/atoms'
import React, { ReactNode, useEffect, useMemo } from 'react'
import { ecosystemContext } from '../utils'

/**
 * EcosystemProvider
 *
 * If an `ecosystem` prop is passed, that ecosystem will take charge of all atom
 * usages below it in the component tree.
 *
 * If no `ecosystem` prop is passed, EcosystemProvider creates an atom ecosystem
 * and provides it. The created ecosystem will be destroyed when this
 * EcosystemProvider unmounts. The auto-created ecosystem can be configured with
 * props passed here.
 *
 * ```ts
 * // gives you full control over the ecosystem:
 * <EcosystemProvider ecosystem={ecosystem}>
 *
 * // a convenient shorthand, esp. useful in testing:
 * <EcosystemProvider id="root">
 * ```
 */
export const EcosystemProvider = ({
  children,
  ecosystem,
  ...ecosystemConfig
}:
  | (Partial<{ [k in keyof EcosystemConfig]: undefined }> & {
      children?: ReactNode
      ecosystem?: Ecosystem
    })
  | (Partial<EcosystemConfig> & {
      children?: ReactNode
      ecosystem?: undefined
    })) => {
  const resolvedEcosystem = useMemo(
    () =>
      ecosystem ||
      createEcosystem({
        destroyOnUnmount: true,
        ...ecosystemConfig,
      }),
    // don't pass other vals; just get snapshot when these change
    [ecosystemConfig.id, ecosystem]
  )

  useEffect(
    () => () => {
      // if this provider created an ecosystem, reset it. We shouldn't need to
      // reset hydration, listeners, or overrides - those will be garbage
      // collected when the ecosystem goes out of scope.
      ecosystem ?? resolvedEcosystem.reset()
    },
    [resolvedEcosystem]
  )

  return (
    <ecosystemContext.Provider value={resolvedEcosystem}>
      {children}
    </ecosystemContext.Provider>
  )
}
