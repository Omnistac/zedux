import React, { FC } from 'react'
import { AnyAtom } from '../types'
import { AtomInstanceBase } from '../classes'

export const AtomInstanceProvider: FC<
  | { instance: AtomInstanceBase<any, any, AnyAtom>; instances?: undefined }
  | { instance?: undefined; instances: AtomInstanceBase<any, any, AnyAtom>[] }
> = ({ children, instance, instances }) => {
  if (!instance && !instances) {
    throw new Error(
      'Zedux: AtomInstanceProvider requires either an `instance` or `instances` prop'
    )
  }

  const allInstances =
    instances || ([instance] as AtomInstanceBase<any, any, AnyAtom>[])

  if (!allInstances.length) {
    return <>{children}</>
  }

  const [parentInstance, ...childInstances] = allInstances
  const context = parentInstance.atom.getReactContext()

  return (
    <context.Provider value={allInstances[0]}>
      <AtomInstanceProvider instances={childInstances}>
        {children}
      </AtomInstanceProvider>
    </context.Provider>
  )
}
