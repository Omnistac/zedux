import { is } from '@zedux/core'
import {
  AtomSelectorConfig,
  AtomSelectorOrConfig,
  DehydrationFilter,
  EvaluationReason,
  NodeFilter,
  SelectorGenerics,
} from '../types/index'
import {
  destroyBuffer,
  flushBuffer,
  getEvaluationContext,
  startBuffer,
} from '../utils/evaluationContext'
import { prefix } from '../utils/general'
import { pluginActions } from '../utils/plugin-actions'
import { Ecosystem } from './Ecosystem'
import {
  destroyNodeFinish,
  destroyNodeStart,
  GraphNode,
  normalizeNodeFilter,
  scheduleDependents,
  setNodeStatus,
} from './GraphNode'
import { AtomTemplateBase } from './templates/AtomTemplateBase'

const defaultResultsComparator = (a: any, b: any) => a === b

export const getSelectorKey = (
  ecosystem: Ecosystem,
  template: AtomSelectorOrConfig
) => {
  const existingId = ecosystem.b.get(template)

  if (existingId) return existingId

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
  const { _mods, modBus } = node.e
  const selector = typeof node.t === 'function' ? node.t : node.t.selector

  const resultsComparator =
    (typeof node.t !== 'function' && node.t.resultsComparator) ||
    defaultResultsComparator

  const { n, s } = getEvaluationContext()
  startBuffer(node)

  try {
    const result = selector(node.e.live, ...node.p)

    if (isInitializing) {
      setNodeStatus(node, 'Active')
    } else if (!resultsComparator(result, node.v as G['State'])) {
      if (!suppressNotify) scheduleDependents(node, result, node.v)

      if (_mods.stateChanged) {
        modBus.dispatch(
          pluginActions.stateChanged({
            newState: result,
            node,
            oldState: node.v,
            reasons: node.w,
          })
        )
      }
    }

    node.v = result
  } catch (err) {
    destroyBuffer(n, s)
    console.error(
      `Zedux encountered an error while running selector with id "${node.id}":`,
      err
    )

    throw err
  } finally {
    node.w = []
  }
  flushBuffer(n, s)
}

export const swapSelectorRefs = <G extends SelectorGenerics>(
  ecosystem: Ecosystem,
  oldCache: SelectorInstance<G>,
  newRef: G['Template'],
  params: any[] = []
) => {
  const baseKey = ecosystem.b.get(oldCache.t)

  if (!baseKey) return // TODO: remove

  ecosystem.b.set(newRef, baseKey)
  ecosystem.b.delete(oldCache.t)
  oldCache.t = newRef
  oldCache.p = params
  runSelector(oldCache, false, true)
}

export class SelectorInstance<
  G extends SelectorGenerics = {
    Params: any
    State: any
    Template: any
  }
> extends GraphNode<G> {
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
    public p: G['Params']
  ) {
    super()
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
   * @see GraphNode.get
   */
  public get() {
    return this.v as G['State']
  }

  /**
   * @see GraphNode.d
   */
  public d(options?: DehydrationFilter) {
    if (this.f(options)) return this.get()
  }

  /**
   * @see GraphNode.f
   */
  public f(options?: NodeFilter) {
    const { id } = this
    const lowerCaseId = id.toLowerCase()
    const { exclude = [], include = [] } = normalizeNodeFilter(options)

    return (
      !exclude.some(templateOrKey =>
        typeof templateOrKey === 'string'
          ? lowerCaseId.includes(templateOrKey.toLowerCase())
          : !is(templateOrKey, AtomTemplateBase) &&
            getSelectorKey(this.e, templateOrKey as AtomSelectorOrConfig)
      ) &&
      (!include ||
        include.some(templateOrKey =>
          typeof templateOrKey === 'string'
            ? lowerCaseId.includes(templateOrKey.toLowerCase())
            : !is(templateOrKey, AtomTemplateBase) &&
              getSelectorKey(this.e, templateOrKey as AtomSelectorOrConfig)
        ))
    )
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
  public j = () => runSelector(this)

  /**
   * @see GraphNode.m
   */
  public m() {
    this.destroy()
  }

  /**
   * @see GraphNode.r
   */
  public r(reason: EvaluationReason, shouldSetTimeout?: boolean) {
    this.w.push(reason)

    if (this.w.length > 1) return // job already scheduled

    this.e._scheduler.schedule(this, shouldSetTimeout)
  }

  /**
   * `v`alue - the current cached selector result
   */
  public v?: G['State']
}
