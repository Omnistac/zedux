import React, { FC } from 'react'
import { AtomInstance } from '../classes'

export const AtomInstanceProvider: FC<
  | { instance: AtomInstance<any, any, any>; instances?: undefined }
  | { instance?: undefined; instances: AtomInstance<any, any, any>[] }
> = ({ children, instance, instances }) => {
  const allInstances =
    instances || ([instance] as AtomInstance<any, any, any>[])

  const el = allInstances.reduceRight((child, instance) => {
    const context = instance.atom.getReactContext()

    return <context.Provider value={instance}>{child}</context.Provider>
  }, children)

  return <>{el}</> // why .. can't we return el
}
