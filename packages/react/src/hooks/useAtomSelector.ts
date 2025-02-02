import {
  ExternalNode,
  ParamsOf,
  Selectable,
  SelectorInstance,
  StateOf,
} from '@zedux/atoms'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Eventless, External } from '../utils'
import { useEcosystem } from './useEcosystem'
import { useReactComponentId } from './useReactComponentId'

/**
 * Get the result of running a selector in the current ecosystem.
 *
 * If the exact selector function (or object if it's an AtomSelectorConfig
 * object) reference + params combo has been used in this ecosystem before,
 * return the cached result.
 *
 * Register a dynamic graph dependency between this React component (as a new
 * external node) and the selector.
 */
export const useAtomSelector = <S extends Selectable>(
  template: S,
  ...args: ParamsOf<S>
): StateOf<S> => {
  const ecosystem = useEcosystem()
  const observerId = useReactComponentId()
  // use this referentially stable setState function as a ref. We lazily add
  // `i`nstance and `m`ounted properties
  const [, render] = useState<undefined | object>() as [
    any,
    Dispatch<SetStateAction<object | undefined>> & {
      m: boolean
      i?: SelectorInstance
    }
  ]

  let instance: SelectorInstance = render.i
    ? ecosystem.u(render.i, template, args, render)
    : ecosystem.getNode(template, args)

  const renderedValue = instance.v
  render.i = instance

  let node =
    (ecosystem.n.get(observerId) as ExternalNode) ??
    new ExternalNode(ecosystem, observerId, render)

  const addEdge = () => {
    node.l === 'Destroyed' &&
      (node = new ExternalNode(ecosystem, observerId, render))
    node.i === instance ||
      node.u(instance, 'useAtomSelector', Eventless | External)
  }

  // Yes, subscribe during render. This operation is idempotent.
  addEdge()

  useEffect(() => {
    instance = ecosystem.getNode(template, args)
    render.i = instance

    // Try adding the edge again (will be a no-op unless React's StrictMode ran
    // this effect's cleanup unnecessarily)
    addEdge()
    render.m = true

    // an unmounting component's effect cleanup can force-destroy the selector
    // or update the state of its dependencies (causing it to rerun) before we
    // set `render.m`ounted. If that happened, trigger a rerender to recreate
    // the selector and/or get its new state
    if (instance.v !== renderedValue || instance.l === 'Destroyed') {
      render({})
    }

    return () => {
      // remove the edge immediately - no need for a delay here. When StrictMode
      // double-invokes (invokes, then cleans up, then re-invokes) this effect,
      // it's expected that selectors and `ttl: 0` atoms with no other
      // dependents get destroyed and recreated - that's part of what StrictMode
      // is ensuring
      node.k(instance)
      // don't set `render.m = false` here
    }
  }, [instance.id])

  return renderedValue
}
