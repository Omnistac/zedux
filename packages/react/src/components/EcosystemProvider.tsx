import React, { ReactNode, useMemo } from 'react'
import { useSyncExternalStore } from 'react'
import { createEcosystem, Ecosystem, EcosystemConfig } from '@zedux/atoms'
import { ecosystemContext } from '../utils'

/**
 * EcosystemProvider
 *
 * Creates an atom ecosystem. The behavior of atoms inside this EcosystemProvider can
 * be configured with props passed here.
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
