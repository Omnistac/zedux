import { ActionFactoryPayloadType, is } from '@zedux/core'
import { AnyAtomInstance } from '../types/index'
import { type GraphNode } from '../classes/GraphNode'
import { AtomInstance } from '../classes/instances/AtomInstance'
import { ExplicitExternal, OutOfRange } from './general'
import { addEdge, removeEdge, scheduleNodeDestruction } from './graph'
import { pluginActions } from './plugin-actions'

export interface EvaluationContext {
  /**
   * `n`ode - the node that's currently evaluating
   */
  n?: GraphNode

  /**
   * `s`tartTime - The high-def timestamp of when the node was "pushed" onto the
   * stack
   */
  s?: number
}

/**
 * A "stack" that gets replaced inline - the next stack item swaps itself in,
 * then restores the previous item when it finishes. This is much faster than
 * pushing/popping an array of stack items (see https://jsbench.me/epm08a9mds/1)
 *
 * This has to live in the module scope so `readInstance` can access it without
 * any ecosystem context. That's how injectors work.
 */
let evaluationContext: EvaluationContext = {}

const perf = typeof performance === 'undefined' ? Date : performance

/**
 * In the current buffer, draw a new edge between the currently evaluating graph
 * node and the passed node. This is how automatic dependencies are created
 * between atoms, selectors, signals, and external nodes like React components.
 *
 * This is only used internally. We should make sure we only call it in a
 * reactive context (where `evaluationContext.n` is set) so we can avoid extra
 * checks and throws.
 */
export const bufferEdge = (
  source: GraphNode,
  operation: string,
  flags: number
) => {
  const { s } = evaluationContext.n!
  const existingEdge = s.get(source)

  if (existingEdge) {
    if (flags < (existingEdge.p || OutOfRange)) existingEdge.p = flags
  } else {
    s.set(source, {
      flags: OutOfRange, // set to an out-of-range flag to indicate a new edge
      p: flags,
      operation,
    })
  }
}

/**
 * If a node errors during evaluation, we need to destroy any nodes created
 * during that evaluation that now have no dependents.
 *
 * Always pass the previously captured node/startTime (undefined if this is the
 * last item in the stack)
 */
export const destroyBuffer = (
  previousNode: GraphNode | undefined,
  previousStartTime: number | undefined
) => {
  for (const [source, sourceEdge] of evaluationContext.n!.s) {
    // the edge wasn't created during the evaluation that errored; keep it
    if (sourceEdge.flags === OutOfRange) {
      scheduleNodeDestruction(source)
    }

    sourceEdge.p = undefined
  }

  finishBuffer(previousNode, previousStartTime)
}

const finishBuffer = (previousNode?: GraphNode, previousStartTime?: number) => {
  const { _mods, modBus } = evaluationContext.n!.e

  if (_mods.evaluationFinished) {
    const time = evaluationContext.s ? perf.now() - evaluationContext.s : 0

    const action: ActionFactoryPayloadType<
      typeof pluginActions.evaluationFinished
    > = { node: evaluationContext.n!, time }

    modBus.dispatch(pluginActions.evaluationFinished(action))
  }

  evaluationContext.n = previousNode
  evaluationContext.s = previousStartTime
}

/**
 * Stop buffering updates for the node passed to `.bufferUpdates()` and add the
 * buffered edges to the graph.
 *
 * Always pass the previously captured node/startTime (undefined if this is the
 * last item in the stack)
 */
export const flushBuffer = (
  previousNode: GraphNode | undefined,
  previousStartTime: number | undefined
) => {
  for (const [source, sourceEdge] of evaluationContext.n!.s) {
    // remove the edge if it wasn't recreated while buffering. Don't remove
    // anything but implicit-internal edges (those are the only kind we
    // auto-create during evaluation - other types may have been added
    // manually by the user and we don't want to touch them here)
    if (sourceEdge.flags & ExplicitExternal) continue

    if (sourceEdge.p == null) {
      removeEdge(evaluationContext.n!, source)
    } else {
      if (sourceEdge.flags === OutOfRange) {
        // add new edges that we tracked while buffering
        addEdge(evaluationContext.n!, source, sourceEdge)
      }

      sourceEdge.flags = sourceEdge.p
    }

    sourceEdge.p = undefined
  }

  finishBuffer(previousNode, previousStartTime)
}

export const getEvaluationContext = () => evaluationContext

export const readInstance = () => {
  const node = evaluationContext.n

  if (DEV && !is(node, AtomInstance)) {
    throw new Error('Zedux: Injectors can only be used in atom state factories')
  }

  return node as AnyAtomInstance
}

export const setEvaluationContext = (newContext: EvaluationContext) =>
  (evaluationContext = newContext)

/**
 * Prevent new graph edges from being added immediately. Instead, buffer them so
 * we can prevent duplicates or unnecessary edges. Call `flushBuffer()` to
 * finish buffering.
 *
 * This is used during atom and AtomSelector evaluation to make the graph as
 * efficient as possible.
 *
 * Capture the current top of the "stack" before calling this. Example:
 *
 * ```ts
 * const { n, s } = getEvaluationContext()
 * ```
 */
export const startBuffer = (node: GraphNode) => {
  // TODO: when `evaluationFinished` is replaced with `runStart`/`runEnd`, make
  // this function return the previous `evaluationContext.n` value so all
  // callers don't have to `getEvaluationContext()` first
  evaluationContext.n = node

  if (node.e._mods.evaluationFinished) {
    evaluationContext.s = perf.now()
  }
}
