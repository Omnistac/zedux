import React, { FC, ReactNode } from 'react'
import { AnyAtom } from '../types'
import { AtomInstanceBase } from '../classes'

export const AtomInstanceProvider: FC<
  | {
      children: ReactNode
      instance: AtomInstanceBase<any, any, AnyAtom>
      instances?: undefined
    }
  | {
      children: ReactNode
      instance?: undefined
      instances: AtomInstanceBase<any, any, AnyAtom>[]
    }
> = ({ children, instance, instances }) => {
  if (DEV && !instance && !instances) {
    throw new Error(
      'Zedux: AtomInstanceProvider requires either an `instance` or `instances` prop'
    )
  }

  const allInstances =
    instances || ([instance] as AtomInstanceBase<any, any, AnyAtom>[])

  if (allInstances.length === 1) {
    const context = allInstances[0].atom.getReactContext()

    return (
      <context.Provider value={allInstances[0]}>{children}</context.Provider>
    )
  }

  const [parentInstance, ...childInstances] = allInstances
  const context = parentInstance.atom.getReactContext()

  return (
    <context.Provider value={parentInstance}>
      <AtomInstanceProvider instances={childInstances}>
        {children}
      </AtomInstanceProvider>
    </context.Provider>
  )
}
