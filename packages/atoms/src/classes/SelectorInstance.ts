import {
  AtomSelector,
  AtomSelectorConfig,
  AtomSelectorOrConfig,
  DehydrationFilter,
  InternalEvaluationReason,
  SelectorGenerics,
} from '../types/index'
import {
  destroyBuffer,
  flushBuffer,
  startBuffer,
} from '../utils/evaluationContext'
import { isListeningTo, sendEcosystemErrorEvent } from '../utils/events'
import { ERROR, prefix } from '../utils/general'
import {
  destroyNodeFinish,
  destroyNodeStart,
  handleStateChange,
  setNodeStatus,
} from '../utils/graph'
import { Ecosystem } from './Ecosystem'
import { GraphNode } from './GraphNode'

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

    throw err
  } finally {
    node.w = []
  }

  flushBuffer(prevNode)

  if (isInitializing) {
    setNodeStatus(node, 'Active', getSelectorKey(node.e, node.t))
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
  // ecosystem (e.g. via `new SelectorInstance`). Only the ecosystem `getNode*`
  // methods add the selector ref to `ecosystem.b`aseKeys. Change that.
  if (!baseKey) return

  ecosystem.b.set(newRef, baseKey)
  ecosystem.b.delete(oldInstance.t)
  oldInstance.t = newRef
  oldInstance.p = params
  runSelector(oldInstance, false, true)
}

export class SelectorInstance<
  G extends SelectorGenerics = {
    Params: any[]
    State: any
    Template: any
  }
> extends GraphNode<G & { Events: any }> {
  public static $$typeof = Symbol.for(`${prefix}/SelectorInstance`)

  constructor(
    /**
     * @see GraphNode.e
     */
    public e: Ecosystem,

    /**
     * @see GraphNode.id
     */
    public id: string,

    /**
     * `t`emplate - the function or object reference of this selector or
     * selector config object
     *
     * @see GraphNode.t
     */
    public t: G['Template'],

    /**
     * @see GraphNode.p
     */
    public p: G['Params']
  ) {
    super()
    runSelector(this, true)
  }

  /**
   * @see GraphNode.destroy
   */
  public destroy(force?: boolean) {
    destroyNodeStart(this, force) && destroyNodeFinish(this)

    // don't delete the ref from this.e.b; this selector instance isn't
    // necessarily the only one using it (if the selector takes params). Just
    // let the WeakMap clean itself up.
  }

  /**
   * @see GraphNode.d
   */
  public d(options?: DehydrationFilter) {
    if (this.f(options)) return this.v
  }

  /**
   * @see GraphNode.h
   *
   * While selectors can be dehydrated for debugging purposes, they currently
   * can't be hydrated as part of SSR, etc. This is a no-op.
   */
  public h() {}

  /**
   * @see GraphNode.j
   */
  public j() {
    runSelector(this)
  }

  /**
   * @see GraphNode.m
   */
  public m() {
    this.destroy()
  }

  /**
   * @see GraphNode.r
   */
  public r(reason: InternalEvaluationReason, defer?: boolean) {
    this.w.push(reason) === 1 && this.e._scheduler.schedule(this, defer)
  }
}
