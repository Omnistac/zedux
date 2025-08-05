import { type ZeduxNode } from '../classes/ZeduxNode'
import {
  EDGE,
  ExplicitExternal,
  OutOfRange,
  RUN_END,
  RUN_START,
} from './general'
import { addEdge, removeEdge, scheduleNodeDestruction } from './graph'
import { isListeningTo, sendEcosystemEvent } from './events'

export interface EvaluationContext {
  /**
   * `n`ode - the node that's currently evaluating
   */
  n: ZeduxNode | undefined

  /**
   * `u`ntracked - whether an active evaluation is currently being circumvented
   * by `untrack`. This is only true when `untrack` is called while a node is
   * evaluating. When called outside evaluation, it remains false.
   *
   * We use this to defer `signal.set` calls while an instance is evaluating.
   * This needs to happen even when an untracked callback is running.
   */
  u: boolean
}

/**
 * A "stack" that gets replaced inline - the next stack item swaps itself in,
 * then restores the previous item when it finishes. This is much faster than
 * pushing/popping an array of stack items (see https://jsbench.me/epm08a9mds/1)
 *
 * This has to live in the module scope so injectors can access it without any
 * ecosystem context.
 */
let evaluationContext: EvaluationContext = {
  n: undefined,
  u: false,
}

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
  source: ZeduxNode,
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
 * during that evaluation that now have no observers.
 *
 * Always pass the previously captured node/startTime (undefined if this is the
 * last item in the stack)
 */
export const destroyBuffer = (previousNode: ZeduxNode | undefined) => {
  for (const [source, sourceEdge] of evaluationContext.n!.s) {
    // the edge wasn't created during the evaluation that errored; keep it
    if (sourceEdge.flags === OutOfRange) {
      scheduleNodeDestruction(source)
    }

    sourceEdge.p = undefined
  }

  evaluationContext.n!.e.cf(previousNode)
}

/**
 * Finish buffering edges for a node, potentially relinquishing the evaluation
 * context to an outer node.
 *
 * This is split from `finishBufferWithEvent` because this is the "hot path" of
 * Zedux code execution - everything calls this. If no `runEnd` event listeners
 * are registered, we optimize.
 */
export const finishBuffer = (previousNode?: ZeduxNode) => {
  evaluationContext.n = previousNode
}

/**
 * @see finishBuffer
 */
export const finishBufferWithEvent = (previousNode?: ZeduxNode) => {
  sendEcosystemEvent(evaluationContext.n!.e, {
    source: evaluationContext.n!,
    type: RUN_END,
  })

  evaluationContext.n = previousNode
}

/**
 * Stop buffering updates for the node passed to `.bufferUpdates()` and add the
 * buffered edges to the graph.
 *
 * Always pass the previously captured node/startTime (undefined if this is the
 * last item in the stack)
 */
export const flushBuffer = (previousNode: ZeduxNode | undefined) => {
  let source
  const entries = evaluationContext.n!.s.entries()

  // This is micro optimized since it's in Zedux's "hot path".
  while ((source = entries.next().value)) {
    // remove the edge if it wasn't recreated while buffering. Don't remove
    // anything but implicit-internal edges (those are the only kind we
    // auto-create during evaluation - other types may have been added manually
    // by the user and we don't want to touch them here). TODO: this check may
    // be unnecessary - users only manually add observers (e.g. via
    // `ZeduxNode#on`), not sources. Possibly remove
    if (source[1].flags & ExplicitExternal) continue

    if (source[1].p == null) {
      removeEdge(evaluationContext.n!, source[0])
    } else {
      if (source[1].flags === OutOfRange) {
        // add new edges that we tracked while buffering
        addEdge(evaluationContext.n!, source[0], source[1])
      } else if (source[1].flags !== source[1].p) {
        if (isListeningTo(evaluationContext.n!.e, EDGE)) {
          sendEcosystemEvent(evaluationContext.n!.e, {
            action: 'update',
            observer: evaluationContext.n!,
            source: source[0],
            type: EDGE,
          })
        }
      }

      source[1].flags = source[1].p
    }

    source[1].p = undefined
  }

  evaluationContext.n!.e.cf(previousNode)
}

export const getEvaluationContext = () => evaluationContext

export const setEvaluationContext = (newContext: EvaluationContext) =>
  (evaluationContext = newContext)

/**
 * Prevent new graph edges from being added immediately. Instead, buffer them so
 * we can prevent duplicates or unnecessary edges. Call `flushBuffer(prevNode)`
 * (or `destroyBuffer(prevNode)` on error) with the value returned from
 * `startBuffer()` to finish buffering.
 *
 * This is used during atom and selector evaluation to make the graph as
 * efficient as possible.
 */
export const startBuffer = (node: ZeduxNode) => {
  const prevNode = evaluationContext.n

  evaluationContext.n = node

  return prevNode
}

export const startBufferWithEvent = (node: ZeduxNode) => {
  if (isListeningTo(node.e, RUN_START)) {
    sendEcosystemEvent(node.e, { source: node, type: RUN_START })
  }

  return startBuffer(node)
}

/**
 * Runs the callback with no reactive tracking and returns its value.
 *
 * This is a common utility of reactive libraries. It prevents any reactive
 * function calls (like `ecosystem.get`, `ecosystem.getNode`, and `signal.get`)
 * from registering graph dependencies while the passed callback runs.
 */
export const untrack = <T>(callback: () => T) => {
  const { n, u } = evaluationContext

  if (n) evaluationContext.u = true
  evaluationContext.n = undefined

  try {
    return callback()
  } finally {
    evaluationContext.n = n
    evaluationContext.u = u
  }
}
