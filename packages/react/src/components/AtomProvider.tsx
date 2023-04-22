import React, { FC, ReactNode } from 'react'
import { AnyAtomInstance } from '@zedux/atoms'
import { useEcosystem } from '../hooks'

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
export const AtomProvider: FC<
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
> = ({ children, instance, instances }) => {
  const ecosystem = useEcosystem()

  if (DEV && !instance && !instances) {
    throw new Error(
      'Zedux: AtomProvider requires either an `instance` or `instances` prop'
    )
  }

  const allInstances = instances || ([instance] as AnyAtomInstance[])

  if (allInstances.length === 1) {
    const context = ecosystem._getReactContext(allInstances[0].template)

    return (
      <context.Provider value={allInstances[0]}>{children}</context.Provider>
    )
  }

  const [parentInstance, ...childInstances] = allInstances
  const context = ecosystem._getReactContext(parentInstance.template)

  return (
    <context.Provider value={parentInstance}>
      <AtomProvider instances={childInstances}>{children}</AtomProvider>
    </context.Provider>
  )
}
