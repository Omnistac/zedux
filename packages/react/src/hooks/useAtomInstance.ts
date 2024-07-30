import {
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomInstanceType,
  AtomParamsType,
  ParamlessTemplate,
} from '@zedux/atoms'
import { useEffect, useState } from 'react'
import { ZeduxHookConfig } from '../types'
import { External, Static } from '../utils'
import { useEcosystem } from './useEcosystem'
import { useReactComponentId } from './useReactComponentId'

const OPERATION = 'useAtomInstance'

/**
 * Creates an atom instance for the passed atom template based on the passed
 * params. If an instance has already been created for the passed params, reuses
 * the existing instance.
 *
 * Registers a static graph dependency on the atom instance. This means
 * components that use this hook will not rerender when this atom instance's
 * state changes.
 *
 * If the atom doesn't take params or an instance is passed, pass an empty array
 * for the 2nd param when you need to supply the 3rd `config` param.
 *
 * The 3rd `config` param is an object with these fields:
 *
 * - `operation` - Used for debugging. Pass a string to describe the reason for
 *   creating this graph edge
 * - `subscribe` - Pass `subscribe: true` to make `useAtomInstance` create a
 *   dynamic graph dependency instead
 * - `suspend` - Pass `suspend: false` to prevent this hook from triggering
 *   React suspense if the resolved atom has a promise set
 *
 * Note that if the params are large, serializing them every render can cause
 * some overhead.
 *
 * @param atom The atom template to instantiate or reuse an instantiation of OR
 * an atom instance itself.
 * @param params The params for generating the instance's key. Required if an
 * atom template is passed that requires params.
 * @param config An object with optional `operation`, `subscribe`, and `suspend`
 * fields.
 */
export const useAtomInstance: {
  <A extends AnyAtomTemplate>(
    template: A,
    params: AtomParamsType<A>,
    config?: ZeduxHookConfig
  ): AtomInstanceType<A>

  <A extends AnyAtomTemplate<{ Params: [] }>>(template: A): AtomInstanceType<A>

  <A extends AnyAtomTemplate>(
    template: ParamlessTemplate<A>
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
  const [, render] = useState<undefined | object>()

  // It should be fine for this to run every render. It's possible to change
  // approaches if it is too heavy sometimes. But don't memoize this call:
  const instance = ecosystem.getInstance(atom as A, params as AtomParamsType<A>)
  const renderedState = instance.getState()

  const addEdge = () => {
    if (!ecosystem._graph.nodes[instance.id]?.dependents.get(dependentKey)) {
      ecosystem._graph.addEdge(
        dependentKey,
        instance.id,
        operation,
        External | (subscribe ? 0 : Static),
        () => {
          if ((render as any).mounted) render({})
        }
      )
    }
  }

  // Yes, subscribe during render. This operation is idempotent and we handle
  // React's StrictMode specifically.
  addEdge()

  // Only remove the graph edge when the instance id changes or on component
  // destruction.
  useEffect(() => {
    // Try adding the edge again (will be a no-op unless React's StrictMode ran
    // this effect's cleanup unnecessarily)
    addEdge()

    // use the referentially stable render function as a ref :O
    ;(render as any).mounted = true

    // an unmounting component's effect cleanup can update or force-destroy the
    // atom instance before this component is mounted. If that happened, trigger
    // a rerender to recreate the atom instance and/or get its new state
    if (
      instance.getState() !== renderedState ||
      instance.status === 'Destroyed'
    ) {
      render({})
    }

    return () => {
      // remove the edge immediately - no need for a delay here. When StrictMode
      // double-invokes (invokes, then cleans up, then re-invokes) this effect,
      // it's expected that any `ttl: 0` atoms get destroyed and recreated -
      // that's part of what StrictMode is ensuring
      ecosystem._graph.removeEdge(dependentKey, instance.id)
      // no need to set `render.mounted` to false here
    }
  }, [instance.id])

  if (suspend !== false) {
    const status = instance._promiseStatus

    if (status === 'loading') {
      throw instance.promise
    } else if (status === 'error') {
      throw instance._promiseError
    }
  }

  return instance
}
