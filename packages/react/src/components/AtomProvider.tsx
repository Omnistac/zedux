import { AnyAtomInstance, Ecosystem } from '@zedux/atoms'
import React, { ReactElement, ReactNode } from 'react'
import { useEcosystem } from '../hooks/useEcosystem'
import { getReactContext, reactContextScope } from '../utils'
import { useAtomInstance } from '../hooks'

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
        instance: AnyAtomInstance | ((ecosystem: Ecosystem) => AnyAtomInstance)
        instances?: undefined
      }
    | {
        children?: ReactNode
        instance?: undefined
        instances:
          | AnyAtomInstance[]
          | ((ecosystem: Ecosystem) => AnyAtomInstance[])
      }
) => ReactElement = ({ children, instance, instances }) => {
  const ecosystem = useEcosystem()

  if (DEV && !instance && !instances) {
    throw new Error(
      'Zedux: AtomProvider requires either an `instance` or `instances` prop'
    )
  }

  ecosystem.S = reactContextScope

  try {
    const [nextInstance, ...childInstances] = instances
      ? typeof instances === 'function'
        ? instances(ecosystem)
        : instances
      : typeof instance === 'function'
      ? [instance(ecosystem)]
      : [instance!]

    const context = getReactContext(ecosystem, nextInstance.t)

    // prevent the atom from being cleaned up until this provider unmounts
    useAtomInstance(nextInstance)

    return (
      <context.Provider value={nextInstance}>
        {childInstances.length ? (
          <AtomProvider instances={childInstances}>{children}</AtomProvider>
        ) : (
          children
        )}
      </context.Provider>
    )
  } finally {
    ecosystem.S = undefined
  }
}
