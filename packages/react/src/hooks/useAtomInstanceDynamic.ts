import { useMemo, useSyncExternalStore } from 'react'
import { AtomBase, AtomInstanceBase } from '../classes'
import {
  AtomInstanceParamsType,
  AtomInstanceStateType,
  AtomInstanceType,
  AtomParamsType,
  AtomStateType,
  EdgeFlag,
  PromiseStatus,
  ZeduxHookConfig,
} from '../types'
import { useEcosystem } from './useEcosystem'

const OPERATION = 'useAtomInstanceDynamic'

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
  <A extends AtomBase<any, [], any>>(atom: A): [
    AtomStateType<A>,
    AtomInstanceType<A>
  ]

  <A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>,
    config?: ZeduxHookConfig
  ): [AtomStateType<A>, AtomInstanceType<A>]

  <AI extends AtomInstanceBase<any, [...any], any>>(
    instance: AI,
    params?: AtomInstanceParamsType<AI>,
    config?: ZeduxHookConfig
  ): [AtomInstanceStateType<AI>, AI]
} = <A extends AtomBase<any, [...any], any>>(
  atom: A | AtomInstanceBase<any, [...any], any>,
  params?: AtomParamsType<A>,
  { operation = OPERATION, startTransition }: ZeduxHookConfig = {
    operation: OPERATION,
  }
) => {
  const ecosystem = useEcosystem()

  // would be nice if React provided some way to know that multiple hooks are
  // from the same component. For now, every Zedux hook usage creates a new
  // graph node
  const dependentKey = useMemo(
    () => ecosystem._idGenerator.generateReactComponentId(),
    []
  )

  // it should be fine for this to run every render. It's possible to change
  // approaches if it is too heavy sometimes. But don't memoize this call:
  const instance = ecosystem.getInstance(atom as A, params as AtomParamsType<A>)

  // Suspense!
  if (instance.promise) {
    if (instance._promiseStatus === PromiseStatus.Pending) {
      throw instance.promise
    } else if (instance._promiseStatus === PromiseStatus.Rejected) {
      throw instance._promiseError
    }
  }

  const [subscribe, getSnapshot] = useMemo(
    () => [
      (onStoreChange: () => void) => {
        // stupid React 18 forcing this function to be idempotent...
        if (
          !ecosystem._graph.nodes[dependentKey]?.dependencies[instance.keyHash]
        ) {
          ecosystem._graph.addEdge(
            dependentKey,
            instance.keyHash,
            operation,
            EdgeFlag.External,
            () => {
              if (!startTransition) return onStoreChange()

              // not sure if React actually supports this. It probably should:
              startTransition(() => {
                onStoreChange()
              })
            }
          )
        }

        return () => {
          ecosystem._graph.removeEdge(dependentKey, instance.keyHash)
        }
      },
      () => instance.store.getState(),
    ],
    [ecosystem, instance]
  )

  const state = useSyncExternalStore(subscribe, getSnapshot)

  return [state, instance] as [AtomStateType<A>, AtomInstanceType<A>]
}
