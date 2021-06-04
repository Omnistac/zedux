import { useLayoutEffect, useMemo, useState } from 'react'
import { AtomInstanceBase } from '../classes'
import { AtomBase } from '../classes/atoms/AtomBase'
import { AtomInstanceType, AtomParamsType } from '../types'
import { GraphEdgeSignal } from '../utils'
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

  <A extends AtomBase<any, any, any>>(
    atom: A,
    params: AtomParamsType<A>,
    shouldRegisterDependency?: boolean
  ): AtomInstanceType<A>

  <AI extends AtomInstanceBase<any, any, any>>(
    instance: AI | AtomBase<any, any, any>, // This '| AtomBase' fixes some types. I think it's fine.
    params?: [],
    shouldRegisterDependency?: boolean
  ): AI
} = <A extends AtomBase<any, any, any>>(
  atom: A | AtomInstanceBase<any, any, any>,
  params?: AtomParamsType<A>,
  shouldRegisterDependency = true
) => {
  const ecosystem = useEcosystem()
  const stableParams = useStableReference(params)
  const [force, forceRender] = useState<any>()

  const [atomInstance, unregister] = useMemo(() => {
    const instance = (atom instanceof AtomInstanceBase
      ? atom
      : ecosystem.getInstance(
          atom,
          stableParams as AtomParamsType<A>
        )) as AtomInstanceType<A>

    if (instance.promise && !instance._isPromiseResolved) {
      throw instance.promise
    }

    if (!shouldRegisterDependency) return [instance]

    const unregister = ecosystem._graph.registerExternalDependent(
      instance,
      signal => {
        if (signal === GraphEdgeSignal.Destroyed) {
          forceRender({})
        }
      },
      'useAtomInstance',
      true
    )

    return [instance, unregister] as const
  }, [atom, ecosystem, force, shouldRegisterDependency, stableParams])

  useLayoutEffect(() => unregister, [unregister])

  return atomInstance
}
