import { createEcosystem, getEcosystem } from '@zedux/atoms'
import { useContext } from 'react'
import { ecosystemContext } from '../utils'

/**
 * Get the current ecosystem controlling atom usages in this component.
 *
 * If an ecosystem has been provided via an `<EcosystemProvider>` above the
 * current component, `useEcosystem()` returns a reference to the provided
 * ecosystem.
 *
 * If no ecosystem has been provided, `useEcosystem()` returns the global
 * ecosystem (creating it if it hasn't been created yet).
 *
 * Returns an Ecosystem class instance.
 */
export const useEcosystem = () => {
  const id = useContext(ecosystemContext)

  return getEcosystem(id) || createEcosystem({ id })
}
