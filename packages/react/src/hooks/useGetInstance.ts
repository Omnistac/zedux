import { AtomBase } from '../classes'
import { AtomInstanceType, AtomParamsType } from '../types'
import { useEcosystem } from './useEcosystem'

/**
 * useGetInstance
 *
 * A React hook that returns a function that can be used to get atom instances.
 * Useful for lazy-loading atom instances, e.g. for render-as-you-fetch React
 * Suspense patterns.
 *
 * The returned `getInstance` function does not register graph dependencies. It
 * simply returns the instance.
 *
 * Optionally accepts an `atom` parameter and returns a `getInstance` function
 * that accepts that atom's parameters as the arguments.
 *
 * ```ts
 * const getMyAtom = useGetInstance(myAtom)
 * const instance1 = getMyAtom('param 1')
 * const instance2 = getMyAtom('param 2')
 *
 * // the above is equivalent to:
 * const getInstance = useGetInstance()
 * const instance1 = getInstance(myAtom, ['param 1'])
 * const instance2 = getInstance(myAtom, ['param 2'])
 * ```
 *
 * @param atom The atom whose instance value we're getting
 * @returns The value of an instance of the atom
 */
export const useGetInstance: {
  <A extends AtomBase<any, any, any>>(atom: A): (
    params: AtomParamsType<A>
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
    return ((params: AtomParamsType<A>) =>
      ecosystem.getInstance(atom, params)) as any // unfortunate
  }

  return <A extends AtomBase<any, any, any>>(
    atom: A,
    params?: AtomParamsType<A>
  ) => ecosystem.getInstance(atom, params as AtomParamsType<A>)
}
