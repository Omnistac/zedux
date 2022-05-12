import React, { ReactNode, useEffect, useMemo, useRef } from 'react'
import { useSyncExternalStore } from 'react'
import { Ecosystem, ecosystemContext } from '../classes'
import { createEcosystem } from '../factories/createEcosystem'
import { useStableReference } from '../hooks/useStableReference'
import { addEcosystem, globalStore } from '../store'
import { EcosystemConfig } from '../types'

/**
 * EcosystemProvider
 *
 * Creates an atom ecosystem. The behavior of atoms inside this EcosystemProvider can
 * be configured with props passed here.
 */
export const EcosystemProvider = ({
  children,
  context,
  defaultForwardPromises,
  defaultTtl,
  destroyOnUnmount = true,
  ecosystem: passedEcosystem,
  flags,
  id,
  onReady,
  overrides,
}:
  | (Partial<{ [k in keyof EcosystemConfig]: undefined }> & {
      children?: ReactNode
      ecosystem?: Ecosystem
    })
  | (Partial<EcosystemConfig> & {
      children?: ReactNode
      ecosystem?: undefined
    })) => {
  const stableOverrides = useStableReference(overrides)

  const [subscribe, getSnapshot] = useMemo(() => {
    const resolvedEcosystem =
      passedEcosystem ||
      createEcosystem({
        context,
        defaultForwardPromises,
        defaultTtl,
        destroyOnUnmount,
        flags,
        id,
        onReady,
        overrides,
      })

    return [
      () => {
        // If this ecosystem is shared across windows, it may still need to be added
        // to this window's instance of Zedux' globalStore
        if (!globalStore.getState().ecosystems[resolvedEcosystem.ecosystemId]) {
          globalStore.dispatch(addEcosystem(resolvedEcosystem))
        }

        resolvedEcosystem._incrementRefCount()

        return () => resolvedEcosystem._decrementRefCount()
      },
      () => resolvedEcosystem,
    ]
  }, [id, passedEcosystem]) // don't pass other vals; just get snapshot when these change

  const ecosystem = useSyncExternalStore(subscribe, getSnapshot)

  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }
    if (!stableOverrides) return

    ecosystem.setOverrides(stableOverrides)
  }, [stableOverrides]) // don't pass ecosystem; just get snapshot when this changes

  return (
    <ecosystemContext.Provider value={ecosystem.ecosystemId}>
      {children}
    </ecosystemContext.Provider>
  )
}
