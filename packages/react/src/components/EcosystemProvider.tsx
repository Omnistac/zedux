import React, { FC, useMemo } from 'react'
import { ecosystem } from '../factories/ecosystem'
import { EcosystemProviderProps } from '../types'

/**
 * EcosystemProvider
 *
 * Creates an atom ecosystem. The behavior of atoms inside this EcosystemProvider can
 * be configured with props passed here.
 */
export const EcosystemProvider: FC<EcosystemProviderProps> = ({
  children,
  flags,
  overrides,
  preload,
}) => {
  const newEcosystem = useMemo(
    () => ecosystem({ destroyOnUnmount: true, flags, overrides }),
    []
  )

  return <newEcosystem.Provider {...{ children, flags, overrides, preload }} />
}
