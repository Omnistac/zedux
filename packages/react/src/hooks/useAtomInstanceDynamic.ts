import { useMemo, useSyncExternalStore } from 'react'
import { AtomBase, AtomInstanceBase } from '../classes'
import {
  AtomInstanceParamsType,
  AtomInstanceStateType,
  AtomInstanceType,
  AtomParamsType,
  AtomStateType,
  EdgeFlag,
  ZeduxHookConfig,
} from '../types'
import { useEcosystem } from './useEcosystem'
import { useReactComponentId } from './useReactComponentId'

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
  { operation = OPERATION, suspend }: ZeduxHookConfig = {
    operation: OPERATION,
  }
) => {
  const ecosystem = useEcosystem()
  const dependentKey = useReactComponentId()

  // it should be fine for this to run every render. It's possible to change
  // approaches if it is too heavy sometimes. But don't memoize this call:
  const instance = ecosystem.getInstance(atom as A, params as AtomParamsType<A>)

  const [subscribe, getSnapshot] = useMemo(() => {
    let val = [instance.store.getState(), instance] as
      | [AtomStateType<A>, AtomInstanceType<A>]
      | undefined

    return [
      (onStoreChange: () => void) => {
        // this function must be idempotent
        if (
          !ecosystem._graph.nodes[instance.keyHash]?.dependents[dependentKey]
        ) {
          // React can unmount other components before calling this subscribe
          // function but after we got the instance above. Re-get the instance
          // if such unmountings destroyed it in the meantime:
          if (instance.activeState === 'Destroyed') {
            val = undefined
            onStoreChange()

            return () => {} // let the next render register the graph edge
          }

          ecosystem._graph.addEdge(
            dependentKey,
            instance.keyHash,
            operation,
            EdgeFlag.External,
            signal => {
              if (signal === 'Destroyed') {
                // returning undefined from `getSnapshot` after we call
                // `onStoreChange` causes the component to rerender. On
                // rerender, we'll set val to an array again, so
                // `useSyncExternalStore` will never actually return undefined.
                val = undefined
              }

              onStoreChange()
            }
          )
        }

        return () => {
          ecosystem._graph.removeEdge(dependentKey, instance.keyHash)
        }
      },
      // this getSnapshot has to return a different val if either the instance
      // or the state change (since in the case of primitive values, the new
      // instance's state could be exactly the same (===) as the previous
      // instance's value)
      () => {
        if (!val) return undefined as any // hack React like dat boi

        // Suspense!
        if (suspend !== false) {
          if (val[1]._promiseStatus === 'loading') {
            throw val[1].promise
          } else if (val[1]._promiseStatus === 'error') {
            throw val[1]._promiseError
          }
        }

        const state = val[1].store.getState()
        if (state === val[0]) return val

        val = [state, val[1]]
        return val
      },
    ]
  }, [ecosystem, instance, suspend])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
