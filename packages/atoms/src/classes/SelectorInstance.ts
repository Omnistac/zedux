import {
  AtomGenerics,
  AtomSelectorOrConfig,
  DehydrationFilter,
  EvaluationReason,
  NodeFilter,
} from '../types'
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

const defaultResultsComparator = (a: any, b: any) => a === b

/**
 * Run an AtomSelector and, depending on the selector's resultsComparator,
 * update its cached result. Updates the graph efficiently (using
 * `.bufferUpdates()`)
 */
export const runSelector = <G extends Pick<AtomGenerics, 'Params' | 'State'>>(
  node: SelectorInstance<G>,
  isInitializing?: boolean
) => {
  const { _mods, modBus } = node.e

  const selector = typeof node.a === 'function' ? node.a : node.a.selector

  const resultsComparator =
    (typeof node.a !== 'function' && node.a.resultsComparator) ||
    defaultResultsComparator

  const { n, s } = getEvaluationContext()
  startBuffer(node)

  try {
    const result = selector(node.e.getters, ...(node.args as G['Params']))

    if (isInitializing) {
      node.v = result

      return setNodeStatus(node, 'Active')
    }

    if (!isInitializing && !resultsComparator(result, node.v as G['State'])) {
      scheduleDependents(node, result, node.v)

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

      node.v = result
    } else if (isInitializing) {
    }
  } catch (err) {
    destroyBuffer(n, s)
    console.error(
      `Zedux encountered an error while running selector with id "${node.id}":`,
      err
    )

    throw err
  } finally {
    flushBuffer(n, s)
    node.w = []
  }
}

export class SelectorInstance<
  G extends Pick<AtomGenerics, 'Params' | 'State'> = { Params: any; State: any }
> extends GraphNode<G> {
  public static $$typeof = Symbol.for(`${prefix}/SelectorInstance`)
  public v?: G['State']

  constructor(
    public e: Ecosystem,
    public id: string,
    /**
     * `a`tomSelectorOrConfigRef - the function or object reference of this
     * selector or selector config object
     */
    public a: AtomSelectorOrConfig<G>,
    public args?: G['Params']
  ) {
    super()
  }

  /**
   * @see GraphNode.destroy
   */
  public destroy(force?: boolean) {
    destroyNodeStart(this, force) && destroyNodeFinish(this)

    // don't delete the ref from this._refBaseKeys; this selector cache isn't
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
      !exclude.some(
        atomOrKey =>
          typeof atomOrKey === 'string' &&
          lowerCaseId.includes(atomOrKey.toLowerCase())
      ) &&
      (!include ||
        include.some(
          atomOrKey =>
            typeof atomOrKey === 'string' &&
            lowerCaseId.includes(atomOrKey.toLowerCase())
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

    this.e._scheduler.schedule(
      {
        id: this.id,
        task: this.t,
        type: 2, // EvaluateGraphNode (2)
      },
      shouldSetTimeout
    )
  }

  public t = () => runSelector(this)
}
