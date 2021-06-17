import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Atom, AtomInstance } from '../classes'
import { AtomInstanceType, AtomParamsType, PromiseStatus } from '../types'
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
  <A extends Atom<any, [], any>>(atom: A): AtomInstanceType<A>

  <A extends Atom<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>,
    shouldRegisterDependency?: boolean
  ): AtomInstanceType<A>

  <AI extends AtomInstance<any, [...any], any, any>>(
    instance: AI,
    params?: [],
    shouldRegisterDependency?: boolean
  ): AI
} = <A extends Atom<any, [...any], any>>(
  atom: A | AtomInstance<any, [...any], any, any>,
  params?: AtomParamsType<A>,
  shouldRegisterDependency = true
) => {
  const [force, forceRender] = useState<any>()
  const ecosystem = useEcosystem()
  const stableParams = useStableReference(params)
  const cleanupRef = useRef<() => void>()

  const atomInstance = useMemo(() => {
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = undefined
    }

    const instance = (atom instanceof AtomInstance
      ? atom
      : ecosystem.getInstance(
          atom,
          stableParams as AtomParamsType<A>
        )) as AtomInstanceType<A>

    if (instance.promise) {
      if (instance._promiseStatus === PromiseStatus.Pending) {
        throw instance.promise
      } else if (instance._promiseStatus === PromiseStatus.Rejected) {
        throw instance._promiseError
      }
    }

    if (!shouldRegisterDependency) return instance

    cleanupRef.current = ecosystem._graph.registerExternalDependent(
      instance,
      signal => {
        if (signal === GraphEdgeSignal.Destroyed) {
          forceRender({})
        }
      },
      'useAtomInstance',
      true
    )

    return instance
  }, [atom, ecosystem, force, shouldRegisterDependency, stableParams])

  useLayoutEffect(() => () => cleanupRef.current?.(), [])

  return atomInstance
}
