import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Atom, AtomInstance } from '../classes'
import {
  AtomInstanceType,
  AtomParamsType,
  AtomStateType,
  PromiseStatus,
} from '../types'
import { GraphEdgeSignal } from '../utils'
import { useEcosystem } from './useEcosystem'
import { useStableReference } from './useStableReference'

/**
 * useAtomInstanceDynamic
 *
 * Creates an atom instance for the passed atom based on the passed params. If
 * an instance has already been created for the passed params, reuses the
 * existing instance.
 *
 * Creates a dynamic graph edge that receives updates when the atom instance's
 * state changes
 *
 * This is a low-level hook that probably shouldn't be used directly. Use
 * higher-level hooks like useAtomValue, useAtomState, and useAtomSelector
 *
 * ```ts
 * const [state, setState] = useAtomState(myAtom)
 * ```
 *
 * @param atom The atom to instantiate or reuse an instantiation of.
 * @param params The params for generating the instance's key.
 */
export const useAtomInstanceDynamic: {
  <A extends Atom<any, [], any>>(atom: A): AtomInstanceType<A>

  <A extends Atom<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomInstanceType<A>

  <AI extends AtomInstance<any, [...any], any, any>>(instance: AI): AI
} = <A extends Atom<any, [...any], any>>(
  atom: A | AtomInstance<any, [...any], any, any>,
  params?: AtomParamsType<A>
) => {
  const [, setReactState] = useState<AtomStateType<A>>()
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

    cleanupRef.current = ecosystem._graph.registerExternalDependent(
      instance,
      (signal, val: AtomStateType<A>) => {
        if (signal === GraphEdgeSignal.Destroyed) {
          forceRender({})
          return
        }

        setReactState(val)
      },
      'useAtomInstanceDynamic',
      false
    )

    return instance
  }, [atom, ecosystem, force, stableParams])

  useLayoutEffect(() => () => cleanupRef.current?.(), [])

  return atomInstance
}
