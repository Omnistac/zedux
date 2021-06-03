import { useContext } from 'react'
import { AtomInstance, StandardAtomBase } from '../classes'
import { AtomInstanceType, AtomParamsType } from '../types'
import { useEcosystem } from './useEcosystem'

export const useAtomConsumer: {
  <A extends StandardAtomBase<any, any, any>>(atom: A):
    | AtomInstanceType<A>
    | Record<string, never>
  <A extends StandardAtomBase<any, any, any>>(
    atom: A,
    defaultParams: AtomParamsType<A>
  ): AtomInstanceType<A>
} = <A extends StandardAtomBase<any, any, any>>(
  atom: A,
  defaultParams?: AtomParamsType<A>
) => {
  const instance = useContext(atom.getReactContext())

  if (!defaultParams || instance instanceof AtomInstance) {
    return instance as AtomInstanceType<A>
  }

  const ecosystem = useEcosystem()

  return ecosystem.getInstance(atom, defaultParams)
}
