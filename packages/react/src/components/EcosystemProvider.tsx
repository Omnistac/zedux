import React, { FC, useEffect, useMemo, useRef } from 'react'
import { Ecosystem, ecosystemContext } from '../classes'
import { ecosystem } from '../factories/ecosystem'
import { addEcosystem, globalStore } from '../store'

/**
 * EcosystemProvider
 *
 * Creates an atom ecosystem. The behavior of atoms inside this EcosystemProvider can
 * be configured with props passed here.
 */
export const EcosystemProvider: FC<{ ecosystem?: Ecosystem }> = ({
  children,
  ecosystem: passedEcosystem,
}) => {
  const theEcosystem = useMemo(() => {
    const resolvedEcosystem =
      passedEcosystem || ecosystem({ destroyOnUnmount: true })

    // If this ecosystem is shared across windows, it may still need to be added
    // to this window's instance of Zedux' globalStore
    if (!globalStore.getState().ecosystems[resolvedEcosystem.ecosystemId]) {
      globalStore.dispatch(addEcosystem(resolvedEcosystem))
    }

    return resolvedEcosystem
  }, [passedEcosystem])

  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    theEcosystem._refCount += 1

    return () => {
      theEcosystem._refCount -= 1
      if (!theEcosystem._destroyOnUnmount) return

      theEcosystem.destroy()
    }
  }, [])

  useEffect(() => {
    // I think it's fine to assume this effect runs after the others in this file. Easy to change approaches if not.
    isFirstRenderRef.current = false
  }, [])

  return (
    <ecosystemContext.Provider value={theEcosystem.ecosystemId}>
      {children}
    </ecosystemContext.Provider>
  )
}
