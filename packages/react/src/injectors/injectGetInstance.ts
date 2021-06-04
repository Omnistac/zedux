import { AtomBase, AtomInstanceBase } from '../classes'
import { AtomInstanceType, AtomParamsType } from '../types'
import { GraphEdgeDynamicity, GraphEdgeInfo } from '../utils'
import { diContext } from '../utils/csContexts'

const defaultEdgeInfo: GraphEdgeInfo = [
  GraphEdgeDynamicity.Static,
  'getInstance',
]

/**
 * injectGetInstance
 *
 * An injector that returns a function that can be used to get atom instances.
 *
 * The returned `getInstance` function will register static graph dependencies
 * during synchronous atom evaluation. If used asynchronously (e.g. in
 * injectEffect), it does not register a graph dependency; it simply returns the
 * instance.
 *
 * Optionally accepts an `atom` parameter and returns a `getInstance` function
 * that accepts that atom's parameters as the arguments.
 *
 * ```ts
 * const getMyAtom = injectGetInstance(myAtom)
 * const instance1 = getMyAtom(['param 1'])
 * const instance2 = getMyAtom(['param 2'])
 *
 * // the above is equivalent to:
 * const getInstance = injectGetInstance()
 * const instance1 = getInstance(myAtom, ['param 1'])
 * const instance2 = getInstance(myAtom, ['param 2'])
 * ```
 *
 * @param atom Optional - The atom whose instance we're getting
 * @returns A `getInstance` function that returns instances of an atom
 */
export const injectGetInstance: {
  <A extends AtomBase<any, any, any>>(atom: A): (
    params: AtomParamsType<A>,
    edgeInfo?: GraphEdgeInfo
  ) => AtomInstanceType<A>

  (): {
    <A extends AtomBase<any, [], any>>(atom: A): AtomInstanceType<A>

    <A extends AtomBase<any, any, any>>(
      atom: A,
      params: AtomParamsType<A>,
      edgeInfo?: GraphEdgeInfo
    ): AtomInstanceType<A>

    <AI extends AtomInstanceBase<any, any, any>>(
      instance: AI | AtomBase<any, any, any>,
      params?: [],
      edgeInfo?: GraphEdgeInfo
    ): AI
  }
} = <A extends AtomBase<any, any, any>>(
  atom?: A | AtomInstanceBase<any, any, any>
) => {
  const { instance } = diContext.consume()

  if (atom) {
    return ((params: AtomParamsType<A>, edgeInfo = defaultEdgeInfo) =>
      instance._getInstance(atom, params, edgeInfo)) as any // unfortunate
  }

  return <A extends AtomBase<any, any, any>>(
    atom: A | AtomInstanceBase<any, any, any>,
    params: AtomParamsType<A>,
    edgeInfo = defaultEdgeInfo
  ) => instance._getInstance(atom, params, edgeInfo)
}
