import { useContext } from 'react'
import { Atom, AtomInstance } from '../classes'
import { AtomInstanceType, AtomParamsType } from '../types'
import { useEcosystem } from './useEcosystem'

export const useAtomConsumer: {
  <A extends Atom<any, [...any], any>>(atom: A):
    | AtomInstanceType<A>
    | Record<string, never>

  <A extends Atom<any, [...any], any>>(
    atom: A,
    defaultParams: AtomParamsType<A>
  ): AtomInstanceType<A>

  <A extends Atom<any, [...any], any>>(
    atom: A,
    throwIfNotProvided: boolean
  ): AtomInstanceType<A>
} = <A extends Atom<any, [...any], any>>(
  atom: A,
  defaultParams?: AtomParamsType<A> | boolean
) => {
  const ecosystem = useEcosystem()
  const instance = useContext(atom.getReactContext())

  if (!defaultParams || instance instanceof AtomInstance) {
    return instance as AtomInstanceType<A>
  }

  if (typeof defaultParams === 'boolean') {
    throw new ReferenceError(
      `Zedux - useAtomConsumer - No atom instance was provided for atom "${atom.key}".`
    )
  }

  return ecosystem.getInstance(atom, defaultParams)
}
