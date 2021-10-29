import { useLayoutEffect, useState } from 'react'
import { AtomInstanceParamsType, AtomInstanceStateType } from '..'
import { AtomBase, AtomInstanceBase } from '../classes'
import {
  AtomInstanceType,
  AtomParamsType,
  AtomStateType,
  PromiseStatus,
} from '../types'
import { GraphEdgeSignal, resolveInstance } from '../utils'
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
  <A extends AtomBase<any, [], any>>(atom: A): AtomInstanceType<A>

  <A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>,
    operation?: string,
    shouldUpdate?: (state: AtomStateType<A>) => boolean
  ): AtomInstanceType<A>

  <AI extends AtomInstanceBase<any, [...any], any>>(
    instance: AI,
    params?: AtomInstanceParamsType<AI>,
    operation?: string,
    shouldUpdate?: (state: AtomInstanceStateType<AI>) => boolean
  ): AI
} = <A extends AtomBase<any, [...any], any>>(
  atom: A | AtomInstanceBase<any, [...any], any>,
  params?: AtomParamsType<A>,
  operation = 'useAtomInstanceDynamic',
  shouldUpdate?: (state: AtomStateType<A>) => boolean
) => {
  const ecosystem = useEcosystem()
  const stableParams = useStableReference(params)
  const [instance, setInstance] = useState(() =>
    resolveInstance(ecosystem, atom, stableParams)
  )
  const [state, setReactState] = useState(() => instance.store.getState())

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
    const currentState = currentInstance.store.getState()

    if (currentInstance !== instance) setInstance(currentInstance)

    // handle any state updates we missed between render and this effect running
    // also handle the case where the instance has changed (e.g. different
    // params were passed)
    if (currentState !== state) setReactState(currentState)

    return ecosystem._graph.registerExternalDependent(
      currentInstance,
      (signal, val: AtomStateType<A>) => {
        if (signal === GraphEdgeSignal.Destroyed) {
          setInstance(resolveInstance(ecosystem, atom, stableParams))
          return
        }

        if (shouldUpdate && !shouldUpdate?.(val)) return

        setReactState(val)
      },
      operation,
      false
    )
  }, [atom, ecosystem, stableParams]) // not instance or state

  return instance
}
