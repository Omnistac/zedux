import React, { FC, useEffect, useMemo, useRef } from 'react'
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
export const EcosystemProvider: FC<
  | (Partial<{ [k in keyof EcosystemConfig]: undefined }> & {
      ecosystem?: Ecosystem
    })
  | (Partial<EcosystemConfig> & { ecosystem?: undefined })
> = ({
  children,
  context,
  defaultForwardPromises,
  defaultTtl,
  destroyOnUnmount = true,
  ecosystem: passedEcosystem,
  ghostTtlMs,
  flags,
  id,
  onReady,
  overrides,
}) => {
  const ecosystem = useMemo(() => {
    const resolvedEcosystem =
      passedEcosystem ||
      createEcosystem({
        context,
        defaultForwardPromises,
        defaultTtl,
        destroyOnUnmount,
        ghostTtlMs,
        flags,
        id,
        onReady,
        overrides,
      })

    // If this ecosystem is shared across windows, it may still need to be added
    // to this window's instance of Zedux' globalStore
    if (!globalStore.getState().ecosystems[resolvedEcosystem.ecosystemId]) {
      globalStore.dispatch(addEcosystem(resolvedEcosystem))
    }

    return resolvedEcosystem
  }, [id, passedEcosystem]) // don't pass other vals; just get snapshot when these change

  const isFirstRenderRef = useRef(true)
  const stableOverrides = useStableReference(overrides)

  useEffect(() => {
    if (isFirstRenderRef.current || !stableOverrides) return

    ecosystem.setOverrides(stableOverrides)
  }, [stableOverrides]) // don't pass ecosystem; just get snapshot when this changes

  useEffect(() => {
    ecosystem._refCount += 1

    return () => {
      ecosystem._refCount -= 1
      if (!ecosystem._destroyOnUnmount) return

      ecosystem.destroy()
    }
  }, [])

  useEffect(() => {
    // I think it's fine to assume this effect runs after the others in this file. Easy to change approaches if not.
    isFirstRenderRef.current = false
  }, [])

  return (
    <ecosystemContext.Provider value={ecosystem.ecosystemId}>
      {children}
    </ecosystemContext.Provider>
  )
}
