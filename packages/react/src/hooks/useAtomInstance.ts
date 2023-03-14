import { useMemo, useSyncExternalStore } from 'react'
import {
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomInstanceType,
  AtomParamsType,
  ParamlessTemplate,
  ZeduxHookConfig,
} from '../types'
import { destroyed, External, Static } from '../utils'
import { useEcosystem } from './useEcosystem'
import { useReactComponentId } from './useReactComponentId'

const OPERATION = 'useAtomInstance'

/**
 * useAtomInstance
 *
 * Creates an atom instance for the passed atom template based on the passed
 * params. If an instance has already been created for the passed params, reuses
 * the existing instance.
 *
 * Registers a static graph dependency on the atom instance. This means
 * components that use this hook will not rerender when this atom instance's
 * state changes.
 *
 * If the params are large, serializing them every render can cause some
 * overhead.
 *
 * @param atom The atom template to instantiate or reuse an instantiation of OR
 * an atom instance itself.
 * @param params The params for generating the instance's key.
 */
export const useAtomInstance: {
  <A extends ParamlessTemplate>(template: A): AtomInstanceType<A>

  <A extends AnyAtomTemplate>(
    template: A,
    params: AtomParamsType<A>,
    config?: ZeduxHookConfig
  ): AtomInstanceType<A>

  <I extends AnyAtomInstance>(
    instance: I,
    params?: [],
    config?: ZeduxHookConfig
  ): I
} = <A extends AnyAtomTemplate>(
  atom: A | AnyAtomInstance,
  params?: AtomParamsType<A>,
  { operation = OPERATION, subscribe, suspend }: ZeduxHookConfig = {
    operation: OPERATION,
  }
) => {
  const ecosystem = useEcosystem()
  const dependentKey = useReactComponentId()

  // it should be fine for this to run every render. It's possible to change
  // approaches if it is too heavy sometimes. But don't memoize this call:
  const instance = ecosystem.getInstance(atom as A, params as AtomParamsType<A>)

  const [subscribeFn, getSnapshot] = useMemo(() => {
    let tuple = [instance, instance.getState()]

    return [
      (onStoreChange: () => void) => {
        // this function must be idempotent
        if (!ecosystem._graph.nodes[instance.id]?.dependents[dependentKey]) {
          // React can unmount other components before calling this subscribe
          // function but after we got the instance above. Re-get the instance
          // if such unmountings destroyed it in the meantime:
          if (instance.status === 'Destroyed') {
            tuple[1] = destroyed
            onStoreChange()

            return () => {} // let the next render register the graph edge
          }

          ecosystem._graph.addEdge(
            dependentKey,
            instance.id,
            operation,
            External | (subscribe ? 0 : Static),
            signal => {
              // returning a unique symbol from `getSnapshot` after we call
              // `onStoreChange` causes the component to rerender. On rerender,
              // instance will be set again, so `useSyncExternalStore` will
              // never actually return that symbol.
              if (signal === 'Destroyed') tuple[1] = destroyed

              onStoreChange()
            }
          )
        }

        return () => {
          ecosystem._graph.removeEdge(dependentKey, instance.id)
        }
      },
      // this getSnapshot has to return a different val if either the instance
      // or the state change (since in the case of primitive values, the new
      // instance's state could be exactly the same (===) as the previous
      // instance's value)
      () => {
        // This hack should work 'cause React can't use the return value unless
        // it renders this component. And when it rerenders,
        // `tuple[1]` will get defined again before this point
        if (tuple[1] === destroyed) return destroyed as any

        if (suspend !== false) {
          const status = tuple[0]._promiseStatus

          if (status === 'loading') {
            throw tuple[0].promise
          } else if (status === 'error') {
            throw tuple[0]._promiseError
          }
        }

        if (!subscribe) return tuple

        const state = tuple[0].getState()

        if (state === tuple[1]) return tuple

        return (tuple = [tuple[0], state])
      },
    ]
  }, [instance, subscribe, suspend])

  return useSyncExternalStore(subscribeFn, getSnapshot, getSnapshot)[0]
}
