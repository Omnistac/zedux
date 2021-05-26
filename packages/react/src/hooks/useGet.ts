import { AtomBase } from '../classes'
import { AtomInstanceType, AtomParamsType } from '../types'
import { useEcosystem } from './useEcosystem'

export const useGet: {
  <A extends AtomBase<any, any, any>>(atom: A): (
    ...params: AtomParamsType<A>
  ) => AtomInstanceType<A>
  (): {
    <A extends AtomBase<any, [], any>>(atom: A): AtomInstanceType<A>
    <A extends AtomBase<any, any, any>>(
      atom: A,
      params: AtomParamsType<A>
    ): AtomInstanceType<A>
  }
} = <A extends AtomBase<any, any, any>>(atom?: A) => {
  const ecosystem = useEcosystem()

  if (atom) {
    return (...params: AtomParamsType<A>) => ecosystem.load(atom, params)
  }

  return <A extends AtomBase<any, any, any>>(
    atom: A,
    params?: AtomParamsType<A>
  ) => ecosystem.load(atom, params as AtomParamsType<A>)
}
