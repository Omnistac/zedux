import { useLayoutEffect, useMemo, useState } from 'react'
import { AtomInstanceParamsType, AtomInstanceStateType } from '..'
import { AtomBase, AtomInstanceBase } from '../classes'
import {
  AtomInstanceType,
  AtomParamsType,
  AtomStateType,
  GraphEdgeSignal,
  PromiseStatus,
} from '../types'
import { useEcosystem } from './useEcosystem'

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
  const [, forceRender] = useState<any>()

  // it should be fine for this to run every render. It's possible to change
  // approaches if it is too heavy sometimes. But don't memoize this call:
  const instance = ecosystem.getInstance(atom as A, params as AtomParamsType<A>)
  const [state, setReactState] = useState(() => instance.store.getState())

  // Suspense!
  if (instance.promise) {
    if (instance._promiseStatus === PromiseStatus.Pending) {
      throw instance.promise
    } else if (instance._promiseStatus === PromiseStatus.Rejected) {
      throw instance._promiseError
    }
  }

  const ghostSubscription = useMemo(
    () =>
      ecosystem._graph.registerGhostDependent(
        instance,
        (signal, val: AtomStateType<A>) => {
          if (signal === GraphEdgeSignal.Destroyed) {
            forceRender({})
            return
          }

          if (shouldUpdate && !shouldUpdate?.(val)) return

          setReactState(val)
        },
        operation,
        false
      ),
    [instance]
  )

  // TODO: guard against ecosystem/instance changing over and over, causing
  // this effect to set React state over and over
  useLayoutEffect(() => {
    const currentState = instance.store.getState()

    // handle any state updates we missed between render and this effect running
    // also handle the case where the instance has changed (e.g. different
    // params were passed)
    if (currentState !== state) setReactState(currentState)

    return ghostSubscription.materialize()
  }, [ghostSubscription, instance]) // not state

  return instance
}
