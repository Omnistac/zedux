import {
  AtomGenerics,
  AtomSelectorOrConfig,
  SelectorInstance,
} from '@zedux/atoms'
import { useEffect, useState } from 'react'
import { External } from '../utils'
import { useEcosystem } from './useEcosystem'
import { useReactComponentId } from './useReactComponentId'

const OPERATION = 'useAtomSelector'

/**
 * Get the result of running an AtomSelector in the current ecosystem.
 *
 * If the exact selector function (or object if it's an AtomSelectorConfig
 * object) reference + params combo has been used in this ecosystem before,
 * return the cached result.
 *
 * Register a dynamic graph dependency between this React component (as a new
 * external node) and the AtomSelector.
 */
export const useAtomSelector = <
  G extends Pick<AtomGenerics, 'Params' | 'State'>
>(
  template: AtomSelectorOrConfig<G>,
  ...args: G['Params']
): G['State'] => {
  const ecosystem = useEcosystem()
  const observerId = useReactComponentId()
  // use this referentially stable setState function as a ref. We lazily add
  // untyped `i`nstance, `m`ounted, and `c`leanup properties
  const [, render] = useState<undefined | object>()

  const existingCache = (render as any).i as SelectorInstance<G> | undefined

  const instance = existingCache
    ? ecosystem.u(existingCache, template, args, render as any)
    : ecosystem.getNode(template, args)

  const addEdge = () => {
    if (!ecosystem.n.get(instance.id)?.s.get(observerId)) {
      ;(render as any).c = instance.on(
        () => {
          if ((render as any).m) render({})
        },
        {
          f: External,
          i: observerId,
          op: OPERATION,
        }
      )
    }
  }

  // Yes, subscribe during render. This operation is idempotent.
  addEdge()

  const renderedResult = instance.v
  ;(render as any).i = instance as SelectorInstance<G>

  useEffect(() => {
    // Try adding the edge again (will be a no-op unless React's StrictMode ran
    // this effect's cleanup unnecessarily)
    addEdge()

    // use the referentially stable render function as a ref :O
    ;(render as any).m = true

    // an unmounting component's effect cleanup can force-destroy the selector
    // or update the state of its dependencies (causing it to rerun) before we
    // set `render.m`ounted. If that happened, trigger a rerender to recreate
    // the selector and/or get its new state
    if (instance.l === 'Destroyed' || instance.v !== renderedResult) {
      render({})
    }

    return () => {
      // remove the edge immediately - no need for a delay here. When StrictMode
      // double-invokes (invokes, then cleans up, then re-invokes) this effect,
      // it's expected that selectors and `ttl: 0` atoms with no other
      // dependents get destroyed and recreated - that's part of what StrictMode
      // is ensuring
      ;(render as any).c?.()
      // no need to set `render.mounted` to false here
    }
  }, [instance.id])

  return renderedResult
}
