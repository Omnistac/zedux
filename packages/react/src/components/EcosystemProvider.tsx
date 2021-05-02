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
  atoms,
  children,
  contexts,
  flags,
  preload,
}) => {
  const newEcosystem = useMemo(
    () => ecosystem({ atoms, contexts, destroyOnUnmount: true, flags }),
    []
  )

  return (
    <newEcosystem.Provider {...{ atoms, children, contexts, flags, preload }} />
  )
}
