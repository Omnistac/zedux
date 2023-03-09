import React, { FC, ReactNode } from 'react'
import { AnyAtomInstance } from '../types'
import { useEcosystem } from '../hooks'

export const AtomInstanceProvider: FC<
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
      'Zedux: AtomInstanceProvider requires either an `instance` or `instances` prop'
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
      <AtomInstanceProvider instances={childInstances}>
        {children}
      </AtomInstanceProvider>
    </context.Provider>
  )
}
