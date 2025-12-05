import {
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomInstance,
  ExternalNode,
  is,
  NodeOf,
  ParamlessTemplate,
  ParamsOf,
  Selectable,
  SelectorInstance,
  ZeduxNode,
  zi,
} from '@zedux/atoms'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { ZeduxHookConfig } from '../types'
import {
  Eventless,
  EventlessStatic,
  External,
  reactContextScope,
} from '../utils'
import { useEcosystem } from './useEcosystem'
import { useReactComponentId } from './useReactComponentId'

const unmaterializedNodes = new Set<ZeduxNode>()
let isQueued = false

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
 * @param template The atom template to instantiate or reuse an instantiation of OR
 * an atom instance itself.
 * @param params The params for generating the instance's key. Required if an
 * atom template is passed that requires params.
 * @param config An object with optional `operation`, `subscribe`, and `suspend`
 * fields.
 */
export const useAtomInstance: {
  <A extends AnyAtomTemplate>(
    template: A,
    params: ParamsOf<A>,
    config?: ZeduxHookConfig
  ): NodeOf<A>

  <A extends AnyAtomTemplate<{ Params: [] }>>(template: A): NodeOf<A>

  <A extends AnyAtomTemplate>(template: ParamlessTemplate<A>): NodeOf<A>

  <I extends AnyAtomInstance>(
    instance: I,
    params?: [],
    config?: ZeduxHookConfig
  ): I

  <S extends Selectable>(
    template: S,
    params: ParamsOf<S>,
    config?: Omit<ZeduxHookConfig, 'subscribe'>
  ): NodeOf<S>

  <S extends Selectable<any, []>>(template: S): NodeOf<S>

  <S extends Selectable>(template: ParamlessTemplate<S>): NodeOf<S>
} = <A extends AnyAtomTemplate>(
  template: A | AnyAtomInstance,
  params?: ParamsOf<A>,
  { operation = 'useAtomInstance', subscribe, suspend }: ZeduxHookConfig = {}
) => {
  const ecosystem = useEcosystem()
  ecosystem.S = reactContextScope
  const observerId = useReactComponentId(ecosystem)

  // use this referentially stable setState function as a ref. We lazily add
  // a `m`ounted property
  const [, render] = useState<undefined | object>() as [
    any,
    Dispatch<SetStateAction<object | undefined>> & {
      m: boolean
      i?: SelectorInstance
    }
  ]

  let instance: AtomInstance | SelectorInstance

  try {
    // It should be fine for this to run every render. It's possible to change
    // approaches if it is too heavy sometimes. But don't memoize this call:
    instance = render.i
      ? ecosystem.u(render.i, template, params ?? [], render)
      : ecosystem.getNode(template, params)
  } finally {
    // We shouldn't need to capture/restore previous `S`cope. There should be no
    // way for React to be rendering inside another scope.
    ecosystem.S = undefined
  }

  const renderedInstance = instance
  const renderedValue = instance.v
  const isSelector = is(instance, SelectorInstance)

  if (isSelector) {
    if (!render.i && !instance.o.size) {
      unmaterializedNodes.add(instance)
    }

    render.i = instance as SelectorInstance
  }

  // Only remove the graph edge when the instance id changes or on component
  // destruction.
  useEffect(() => {
    instance = instance.V
      ? ecosystem.withScope(instance.V!, () =>
          ecosystem.getNode(template, params)
        )
      : ecosystem.getNode(template, params)

    if (isSelector) render.i = instance as SelectorInstance

    let node =
      (ecosystem.n.get(observerId) as ExternalNode) ??
      new ExternalNode(ecosystem, observerId, render)

    const addEdge = () => {
      node.l === zi.D &&
        (node = new ExternalNode(ecosystem, observerId, render))

      // cancel edge cleanup if the below effect cleanup ran and scheduled it but
      // the component rerendered or the effect ran again before it happened
      node.c?.()

      if (node.i !== instance) {
        node.u(
          instance,
          operation,
          External | (subscribe ? Eventless : EventlessStatic)
        )
      }
    }

    // Try adding the edge again (will be a no-op unless React's StrictMode ran
    // this effect's cleanup unnecessarily)
    addEdge()
    render.m = true

    if (!isQueued) {
      isQueued = true
      ecosystem.asyncScheduler.queue(() => {
        isQueued = false
        unmaterializedNodes.forEach(node => node.destroy())
        unmaterializedNodes.clear()
      })
    }

    // an unmounting component's effect cleanup can update or force-destroy the
    // atom instance before this component is mounted. If that happened, trigger
    // a rerender to recreate the atom instance and/or get its new state
    if (
      (subscribe && instance.v !== renderedValue) ||
      renderedInstance.l === zi.D
    ) {
      render({})
    }

    return () => {
      node.k(instance, true)
      // don't set `render.m = false` here
    }
  }, [instance])

  if (suspend !== false) {
    const status = (instance as AtomInstance).promiseStatus

    if (status === 'loading') {
      throw (instance as AtomInstance).promise
    } else if (status === 'error') {
      throw (instance as AtomInstance).promiseError
    }
  }

  return instance
}
