import { useMemo, useSyncExternalStore } from 'react'
import { AtomBase, AtomInstance, AtomInstanceBase } from '../classes'
import {
  AtomInstanceType,
  AtomParamsType,
  EdgeFlag,
  ZeduxHookConfig,
} from '../types'
import { useEcosystem } from './useEcosystem'
import { useReactComponentId } from './useReactComponentId'

const OPERATION = 'useAtomInstance'

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
 * If the params are large, serializing them every render can cause some
 * overhead.
 *
 * @param atom The atom to instantiate or reuse an instantiation of
 * @param params The params for generating the instance's key.
 */
export const useAtomInstance: {
  <A extends AtomBase<any, [], any>>(atom: A): AtomInstanceType<A>

  <A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>,
    config?: ZeduxHookConfig
  ): AtomInstanceType<A>

  <AI extends AtomInstance<any, [...any], any, any>>(
    instance: AI,
    params?: [],
    config?: ZeduxHookConfig
  ): AI
} = <A extends AtomBase<any, [...any], any>>(
  atom: A | AtomInstanceBase<any, [...any], any>,
  params?: AtomParamsType<A>,
  { operation = OPERATION, shouldSuspend }: ZeduxHookConfig = {
    operation: OPERATION,
  }
) => {
  const ecosystem = useEcosystem()
  const dependentKey = useReactComponentId()

  // it should be fine for this to run every render. It's possible to change
  // approaches if it is too heavy sometimes. But don't memoize this call:
  const instance = ecosystem.getInstance(atom as A, params as AtomParamsType<A>)

  const [subscribe, getSnapshot] = useMemo(() => {
    let cachedInstance: typeof instance | undefined = instance

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
            cachedInstance = undefined
            onStoreChange()

            return () => {} // let the next render register the graph edge
          }

          ecosystem._graph.addEdge(
            dependentKey,
            instance.keyHash,
            operation,
            EdgeFlag.External | EdgeFlag.Static,
            signal => {
              // see note in useAtomInstanceDynamic
              if (signal === 'Destroyed') cachedInstance = undefined

              onStoreChange()
            }
          )
        }

        return () => {
          ecosystem._graph.removeEdge(dependentKey, instance.keyHash)
        }
      },
      () => {
        // This hack should work 'cause React can't use the return value unless
        // it renders this component. And when it rerenders,
        // `cachedInstance` will get defined again before this point
        if (!cachedInstance) return cachedInstance as typeof instance

        // Suspense!
        if (shouldSuspend !== false) {
          if (cachedInstance._promiseStatus === 'loading') {
            throw cachedInstance.promise
          } else if (cachedInstance._promiseStatus === 'error') {
            throw cachedInstance._promiseError
          }
        }

        return cachedInstance
      },
    ]
  }, [ecosystem, instance, shouldSuspend])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
