import {
  AtomSelector,
  AtomSelectorConfig,
  SelectorTemplate,
  SelectorGenerics,
} from '../types/index'
import { schedulerPost, schedulerPre } from './ecosystem'
import { destroyBuffer, flushBuffer } from './evaluationContext'
import { isListeningTo, sendEcosystemErrorEvent } from './events'
import { ACTIVE, ERROR } from './general'
import { setNodeStatus } from './graph'
import type { Ecosystem } from '../classes/Ecosystem'
import type { SelectorInstance } from '../classes/SelectorInstance'

const defaultResultsComparator = (a: any, b: any) => a === b

/**
 * Get the fully qualified id for the given selector+params combo.
 */
export const getInstanceId = (
  ecosystem: Ecosystem,
  selectorOrConfig: SelectorTemplate,
  params?: any[]
) => {
  const baseKey = getSelectorKey(ecosystem, selectorOrConfig)

  return params?.length ? `${baseKey}-${ecosystem.hash(params)}` : baseKey
}

export const getSelectorKey = (
  ecosystem: Ecosystem,
  template: SelectorTemplate
) => {
  const existingKey = ecosystem.b.get(template)

  if (existingKey) return existingKey

  const key = ecosystem.makeId('selector', getSelectorName(template))

  ecosystem.b.set(template, key)

  return key
}

export const getSelectorName = (template: SelectorTemplate) =>
  template.name || (template as AtomSelectorConfig).selector?.name || 'unknown'

/**
 * Run an AtomSelector and, depending on the selector's resultsComparator,
 * update its cached result. Updates the graph efficiently (using
 * `.bufferUpdates()`)
 */
export const runSelector = <G extends SelectorGenerics>(
  node: SelectorInstance<G>,
  isInitializing?: boolean,
  suppressNotify?: boolean
) => {
  const isFunction = typeof node.t === 'function'
  const prevNode = node.e.cs(node)

  try {
    const result = (
      isFunction
        ? (node.t as AtomSelector)
        : (node.t as AtomSelectorConfig).selector
    )(node.e, ...node.p)

    const oldState = node.v
    node.v = result

    if (
      !isInitializing &&
      !suppressNotify &&
      (isFunction
        ? result !== oldState
        : !(
            (node.t as AtomSelectorConfig).resultsComparator ??
            defaultResultsComparator
          )(result, oldState))
    ) {
      node.e.ch(node, oldState)
    }
  } catch (err) {
    destroyBuffer(prevNode)
    console.error(`Zedux: Error while running selector "${node.id}":`, err)

    if (isListeningTo(node.e, ERROR)) {
      sendEcosystemErrorEvent(node, err)
    }

    // `finally` is slower than repeating this here and outside the `catch`:
    node.w = node.wt = undefined

    throw err
  }

  node.w = node.wt = undefined
  flushBuffer(prevNode)

  if (isInitializing) {
    setNodeStatus(node, ACTIVE)
  }
}

export const swapSelectorRefs = <G extends SelectorGenerics>(
  ecosystem: Ecosystem,
  oldInstance: SelectorInstance<G>,
  newRef: G['Template'],
  params: any[] = []
) => {
  const baseKey = ecosystem.b.get(oldInstance.t)

  // TODO: remove. This is currently needed for selectors created outside the
  // ecosystem (e.g. via `new SelectorInstance`). Only the ecosystem `get*`
  // methods add the selector ref to `ecosystem.b`aseKeys. Change that.
  if (!baseKey) return

  ecosystem.b.set(newRef, baseKey)
  ecosystem.b.delete(oldInstance.t)
  oldInstance.t = newRef
  oldInstance.p = params

  schedulerPre(ecosystem)

  try {
    runSelector(oldInstance, false, true)
  } finally {
    schedulerPost(ecosystem)
  }
}
