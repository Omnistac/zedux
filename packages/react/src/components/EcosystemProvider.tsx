import React, { FC, useMemo } from 'react'
import { ecosystem } from '../factories/ecosystem'
import { EcosystemProviderProps } from '../types'

/**
 * EcosystemProvider
 *
 * Creates an atom ecosystem. The behavior of atoms inside this EcosystemProvider can
 * be altered with props passed here.
 */
export const EcosystemProvider: FC<EcosystemProviderProps> = ({
  children,
  contexts,
  flags,
  overrides,
  preload,
}) => {
  const newEcosystem = useMemo(
    () => ecosystem({ contexts, destroyOnUnmount: true, flags, overrides }),
    []
  )

  return (
    <newEcosystem.Provider
      {...{ children, contexts, flags, overrides, preload }}
    />
  )
}
