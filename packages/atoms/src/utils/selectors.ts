import {
  AtomSelector,
  AtomSelectorConfig,
  AtomSelectorOrConfig,
  SelectorGenerics,
} from '../types/index'
import { schedulerPost, schedulerPre } from './ecosystem'
import { destroyBuffer, flushBuffer, startBuffer } from './evaluationContext'
import { isListeningTo, sendEcosystemErrorEvent } from './events'
import { ACTIVE, ERROR } from './general'
import { handleStateChange, setNodeStatus } from './graph'
import type { Ecosystem } from '../classes/Ecosystem'
import type { SelectorInstance } from '../classes/SelectorInstance'

const defaultResultsComparator = (a: any, b: any) => a === b

export const getSelectorKey = (
  ecosystem: Ecosystem,
  template: AtomSelectorOrConfig
) => {
  const existingKey = ecosystem.b.get(template)

  if (existingKey) return existingKey

  const key = ecosystem._idGenerator.generateId(
    `@@selector-${getSelectorName(template)}`
  )

  ecosystem.b.set(template, key)

  return key
}

export const getSelectorName = (template: AtomSelectorOrConfig) =>
  template.name || (template as AtomSelectorConfig).selector?.name || 'unnamed'

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
  const selector =
    typeof node.t === 'function' ? (node.t as AtomSelector) : node.t.selector

  const resultsComparator =
    (typeof node.t !== 'function' && node.t.resultsComparator) ||
    defaultResultsComparator

  const prevNode = startBuffer(node)

  try {
    const result = selector(node.e, ...node.p)
    const oldState = node.v
    node.v = result

    if (
      !isInitializing &&
      !suppressNotify &&
      !resultsComparator(result, oldState)
    ) {
      handleStateChange(node, oldState)
    }
  } catch (err) {
    destroyBuffer(prevNode)
    console.error(`Zedux: Error while running selector "${node.id}":`, err)

    if (isListeningTo(node.e, ERROR)) {
      sendEcosystemErrorEvent(node, err)
    }

    // `finally` is slower than repeating this here and outside the `catch`:
    node.w = []

    throw err
  }

  node.w = []
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

  const pre = schedulerPre(ecosystem)
  runSelector(oldInstance, false, true)
  schedulerPost(ecosystem, pre)
}
