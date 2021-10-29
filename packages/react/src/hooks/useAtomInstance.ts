import { useLayoutEffect, useState } from 'react'
import { AtomBase, AtomInstance, AtomInstanceBase } from '../classes'
import { AtomInstanceType, AtomParamsType, PromiseStatus } from '../types'
import { GraphEdgeSignal, resolveInstance } from '../utils'
import { useEcosystem } from './useEcosystem'
import { useStableReference } from './useStableReference'

/**
 * useAtomInstance
 *
 * Creates an atom instance for the passed atom based on the passed params. If
 * an instance has already been created for the passed params, reuses the
 * existing instance.
 *
 * Registers a static graph dependency on the atom instance. This means
 * components that use this hook will not rerender when this atom instance's
 * state changes.
 *
 * Pass false as the 3rd param to prevent this graph dependency from being
 * registered. Useful when you need to control the graph dependency manually.
 * `useAtomSelector` does this internally.
 *
 * @param atom The atom to instantiate or reuse an instantiation of
 * @param params The params for generating the instance's key.
 */
export const useAtomInstance: {
  <A extends AtomBase<any, [], any>>(atom: A): AtomInstanceType<A>

  <A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomInstanceType<A>

  <AI extends AtomInstance<any, [...any], any>>(instance: AI, params?: []): AI
} = <A extends AtomBase<any, [...any], any>>(
  atom: A | AtomInstanceBase<any, [...any], any>,
  params?: AtomParamsType<A>
) => {
  const ecosystem = useEcosystem()
  const stableParams = useStableReference(params)
  const [instance, setInstance] = useState<any>(() =>
    resolveInstance(ecosystem, atom, stableParams)
  )

  // Suspense!
  if (instance.promise) {
    if (instance._promiseStatus === PromiseStatus.Pending) {
      throw instance.promise
    } else if (instance._promiseStatus === PromiseStatus.Rejected) {
      throw instance._promiseError
    }
  }

  useLayoutEffect(() => {
    const currentInstance = resolveInstance(ecosystem, atom, stableParams)

    if (currentInstance !== instance) setInstance(currentInstance)

    return ecosystem._graph.registerExternalDependent(
      currentInstance,
      signal => {
        if (signal === GraphEdgeSignal.Destroyed) {
          setInstance(resolveInstance(ecosystem, atom, stableParams))
        }
      },
      'useAtomInstance',
      true
    )
  }, [atom, ecosystem, stableParams]) // not instance

  return instance
}
