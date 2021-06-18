import React, { FC } from 'react'
import { AtomInstanceBase } from '../classes'

export const AtomInstanceProvider: FC<
  | { instance: AtomInstanceBase<any, any, any>; instances?: undefined }
  | { instance?: undefined; instances: AtomInstanceBase<any, any, any>[] }
> = ({ children, instance, instances }) => {
  if (!instance && !instances) {
    throw new Error(
      'Zedux - AtomInstanceProvider requires either an `instance` or `instances` prop'
    )
  }

  const allInstances =
    instances || ([instance] as AtomInstanceBase<any, any, any>[])

  const el = allInstances.reduceRight((child, instance) => {
    const context = instance.atom.getReactContext()

    return <context.Provider value={instance}>{child}</context.Provider>
  }, children)

  return <>{el}</> // why .. can't we return el
}
