import { useMemo, useRef, useSyncExternalStore } from 'react'
import { AtomBase, AtomInstance, AtomInstanceBase } from '../classes'
import {
  AtomInstanceType,
  AtomParamsType,
  EdgeFlag,
  GraphEdgeSignal,
  PromiseStatus,
  ZeduxHookConfig,
} from '../types'
import { useEcosystem } from './useEcosystem'

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

  <AI extends AtomInstance<any, [...any], any>>(
    instance: AI,
    params?: [],
    config?: ZeduxHookConfig
  ): AI
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
  const instanceRef = useRef()
  instanceRef.current = instance

  // Suspense!
  if (instance.promise) {
    if (instance._promiseStatus === PromiseStatus.Pending) {
      throw instance.promise
    } else if (instance._promiseStatus === PromiseStatus.Rejected) {
      throw instance._promiseError
    }
  }

  const [subscribe, getSnapshot] = useMemo(() => {
    return [
      (onStoreChange: () => void) => {
        // stupid React 18 forcing this function to be idempotent...
        if (
          !ecosystem._graph.nodes[dependentKey]?.dependencies[instance.keyHash]
        ) {
          ecosystem._graph.addEdge(
            dependentKey,
            instance.keyHash,
            operation,
            EdgeFlag.External | EdgeFlag.Static,
            signal => {
              if (signal !== GraphEdgeSignal.Destroyed) return

              instanceRef.current = undefined

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
      () =>
        instanceRef.current ||
        (instanceRef.current = ecosystem.getInstance(
          atom as A,
          params as AtomParamsType<A>
        )),
    ]
  }, [ecosystem, instance])

  useSyncExternalStore(subscribe, getSnapshot)

  return instance
}
