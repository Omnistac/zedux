import { AnyAtomInstance } from '@zedux/atoms'
import React, { ReactElement, ReactNode } from 'react'
import { useEcosystem } from '../hooks/useEcosystem'
import { getReactContext } from '../utils'

/**
 * Provides an atom instance over React context.
 *
 * Provided atom instances can be consumed in child components via
 * `useAtomContext()`. The atom instance can then be passed to other hooks like
 * `useAtomValue()` or `useAtomState()` to create a dynamic dependency on the
 * consumed instance.
 *
 * The providing component should typically register at least a static
 * dependency on the provided instance via `useAtomInstance()` or manual
 * graphing inside `useEffect()`.
 */
export const AtomProvider: (
  props:
    | {
        children?: ReactNode
        instance: AnyAtomInstance
        instances?: undefined
      }
    | {
        children?: ReactNode
        instance?: undefined
        instances: AnyAtomInstance[]
      }
) => ReactElement = ({ children, instance, instances }) => {
  const ecosystem = useEcosystem()

  if (DEV && !instance && !instances) {
    throw new Error(
      'Zedux: AtomProvider requires either an `instance` or `instances` prop'
    )
  }

  const [nextInstance, ...childInstances] =
    instances || ([instance] as AnyAtomInstance[])

  const context = getReactContext(ecosystem, nextInstance.template)

  return (
    <context.Provider value={nextInstance}>
      {childInstances.length ? (
        <AtomProvider instances={childInstances}>{children}</AtomProvider>
      ) : (
        children
      )}
    </context.Provider>
  )
}
