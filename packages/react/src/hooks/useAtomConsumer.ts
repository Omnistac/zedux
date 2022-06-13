import { useContext } from 'react'
import { AtomInstanceBase, StandardAtomBase } from '../classes'
import { is } from '../utils'
import { AtomInstanceType, AtomParamsType } from '../types'
import { useEcosystem } from './useEcosystem'

export const useAtomConsumer: {
  <A extends StandardAtomBase<any, [...any], any>>(atom: A):
    | AtomInstanceType<A>
    | Record<string, never>

  <A extends StandardAtomBase<any, [...any], any>>(
    atom: A,
    defaultParams: AtomParamsType<A>
  ): AtomInstanceType<A>

  <A extends StandardAtomBase<any, [...any], any>>(
    atom: A,
    throwIfNotProvided: true
  ): AtomInstanceType<A>
} = <A extends StandardAtomBase<any, [...any], any>>(
  atom: A,
  defaultParams?: AtomParamsType<A> | true
) => {
  const ecosystem = useEcosystem()
  const instance = useContext(ecosystem._getReactContext(atom))

  if (!defaultParams || is(instance, AtomInstanceBase)) {
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
