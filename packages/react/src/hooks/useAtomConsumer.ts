import { is } from '@zedux/core'
import { useContext } from 'react'
import { AtomInstanceBase } from '../classes'
import { AnyAtomTemplate, AtomInstanceType, AtomParamsType } from '../types'
import { useEcosystem } from './useEcosystem'

export const useAtomConsumer: {
  <A extends AnyAtomTemplate>(template: A): AtomInstanceType<A> | undefined

  <A extends AnyAtomTemplate>(
    template: A,
    defaultParams: AtomParamsType<A>
  ): AtomInstanceType<A>

  <A extends AnyAtomTemplate>(
    template: A,
    throwIfNotProvided: boolean
  ): AtomInstanceType<A>
} = <A extends AnyAtomTemplate>(
  template: A,
  defaultParams?: AtomParamsType<A> | boolean
) => {
  const ecosystem = useEcosystem()
  const instance: AtomInstanceType<A> | undefined = useContext(
    ecosystem._getReactContext(template)
  )

  if (!defaultParams || is(instance, AtomInstanceBase)) {
    if (DEV && instance?.status === 'Destroyed') {
      console.error(
        `Zedux: useAtomConsumer - A destroyed atom instance was provided with key "${instance.id}". This is not supported. Provide an active atom instance instead.`
      )
    }

    return instance as AtomInstanceType<A>
  }

  if (typeof defaultParams === 'boolean') {
    if (DEV) {
      throw new ReferenceError(
        `Zedux: useAtomConsumer - No atom instance was provided for atom "${template.key}".`
      )
    } else {
      return instance as AtomInstanceType<A>
    }
  }

  return ecosystem.getInstance(template, defaultParams)
}
