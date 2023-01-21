import { useContext } from 'react'
import { AtomInstanceBase, StandardAtomBase } from '../classes'
import { is } from '../utils'
import { AtomInstanceType, AtomParamsType } from '../types'
import { useEcosystem } from './useEcosystem'

export const useAtomConsumer: {
  <A extends StandardAtomBase<any, [...any], any, any>>(atom: A):
    | AtomInstanceType<A>
    | undefined

  <A extends StandardAtomBase<any, [...any], any, any>>(
    atom: A,
    defaultParams: AtomParamsType<A>
  ): AtomInstanceType<A>

  <A extends StandardAtomBase<any, [...any], any, any>>(
    atom: A,
    throwIfNotProvided: boolean
  ): AtomInstanceType<A>
} = <A extends StandardAtomBase<any, [...any], any, any>>(
  atom: A,
  defaultParams?: AtomParamsType<A> | boolean
) => {
  const ecosystem = useEcosystem()
  const instance = useContext(ecosystem._getReactContext(atom))

  if (!defaultParams || is(instance, AtomInstanceBase)) {
    if (DEV && (instance as AtomInstanceType<A>).activeState === 'Destroyed') {
      throw new Error(
        `Zedux: useAtomConsumer - A destroyed atom instance was provided with key "${
          (instance as AtomInstanceType<A>).keyHash
        }". This is not supported. Provide an active atom instance instead.`
      )
    }

    return instance as AtomInstanceType<A>
  }

  if (typeof defaultParams === 'boolean') {
    if (DEV) {
      throw new ReferenceError(
        `Zedux: useAtomConsumer - No atom instance was provided for atom "${atom.key}".`
      )
    } else {
      return instance as AtomInstanceType<A>
    }
  }

  return ecosystem.getInstance(atom, defaultParams)
}
