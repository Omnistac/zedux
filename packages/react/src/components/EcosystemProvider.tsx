import { createEcosystem, Ecosystem, EcosystemConfig } from '@zedux/atoms'
import React, { ReactNode, useMemo } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim'
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
  ecosystem: passedEcosystem,
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
  const [subscribe, getSnapshot] = useMemo(() => {
    const resolvedEcosystem =
      passedEcosystem ||
      createEcosystem({
        destroyOnUnmount: true,
        ...ecosystemConfig,
      })

    return [
      () => {
        resolvedEcosystem._incrementRefCount()

        return () => resolvedEcosystem._decrementRefCount()
      },
      () => resolvedEcosystem,
    ]
  }, [ecosystemConfig.id, passedEcosystem]) // don't pass other vals; just get snapshot when these change

  const ecosystem = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return (
    <ecosystemContext.Provider value={ecosystem.id}>
      {children}
    </ecosystemContext.Provider>
  )
}
