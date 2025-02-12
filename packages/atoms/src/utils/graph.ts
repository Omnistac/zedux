import {
  AtomGenerics,
  GraphEdge,
  InternalEvaluationReason,
} from '@zedux/atoms/types/index'
import { type GraphNode } from '../classes/GraphNode'
import { SendableEvents } from '../types/events'
import {
  ACTIVE,
  CHANGE,
  CYCLE,
  Cycle,
  DESTROYED,
  EDGE,
  Eventless,
  INITIALIZING,
  InternalLifecycleStatus,
  Static,
} from './general'
import {
  isListeningTo,
  sendEcosystemEvent,
  sendImplicitEcosystemEvent,
} from './events'
import { changeScopedNodeId } from './ecosystem'

/**
 * Actually add an edge to the graph. When we buffer graph updates, we're
 * really just deferring the calling of this function.
 */
export const addEdge = (
  observer: GraphNode,
  source: GraphNode,
  newEdge: GraphEdge
) => {
  // draw the edge in both nodes
  observer.s.set(source, newEdge)
  source.o.set(observer, newEdge)
  source.c?.()

  // Static sources don't change a node's weight
  if (!(newEdge.flags & Static)) {
    recalculateNodeWeight(source.W, observer)
  }

  // scoped atoms propagate their scope to all observers. Any node that uses a
  // scoped atom was run in a scoped context and needs to remember the used
  // scope so it can find its scoped atoms when it reevaluates.
  if (source.V) {
    observer.V ??= new Map()

    for (const [key, val] of source.V) {
      observer.V.set(key, val)
    }
  }

  if (isListeningTo(source.e, EDGE)) {
    sendEcosystemEvent(source.e, {
      action: 'add',
      observer,
      source,
      type: EDGE,
    })
  }

  return newEdge
}

export const destroyNodeStart = (node: GraphNode, force?: boolean) => {
  // If we're not force-destroying, don't destroy if there are dependents. Also
  // don't destroy if `node.K`eep is set
  if (node.l === DESTROYED || (!force && node.o.size - (node.L ? 1 : 0))) {
    return
  }

  node.c?.()
  node.c = undefined

  if (node.w.length) node.e._scheduler.unschedule(node)

  return true
}

// TODO: merge this into destroyNodeStart. We should be able to
export const destroyNodeFinish = (node: GraphNode) => {
  // first remove all edges between this node and its dependencies
  for (const dependency of node.s.keys()) {
    removeEdge(node, dependency)
  }

  // now remove all edges between this node and its dependents
  for (const [observer, edge] of node.o) {
    if (!(edge.flags & Static)) {
      recalculateNodeWeight(-node.W, observer)
    }

    observer.s.delete(node)

    // we _probably_ don't need to send edgeRemoved mod events to plugins for
    // these - it's better that they receive the duplicate edgeCreated event
    // when the dependency is recreated by its dependent(s) so they can infer
    // that the edge was "moved"
  }

  node.e.n.delete(node.id)

  setNodeStatus(node, DESTROYED)
}

export const handleStateChange = <
  G extends Pick<AtomGenerics, 'Events' | 'State'>
>(
  node: GraphNode<G & { Params: any; Template: any }>,
  oldState: G['State'],
  events?: Partial<SendableEvents<G>>
) => {
  const pre = node.e._scheduler.pre()
  const reason = { e: events, n: node.v, o: oldState, r: node.w, s: node }

  if (isListeningTo(node.e, CHANGE)) {
    sendImplicitEcosystemEvent(node.e, reason)
  }

  scheduleDependents(reason)

  // run the scheduler synchronously after any node state update
  node.e._scheduler.post(pre)
}

const recalculateNodeWeight = (weightDiff: number, node: GraphNode) => {
  node.W += weightDiff

  for (const observer of node.o.keys()) {
    recalculateNodeWeight(weightDiff, observer)
  }
}

/**
 * Remove the graph edge between two nodes.
 *
 * For some reason in React 18+, React destroys parents before children. This
 * means a parent EcosystemProvider may have already unmounted and wiped the
 * whole graph; this edge may already be destroyed.
 */
export const removeEdge = (observer: GraphNode, source: GraphNode) => {
  // erase graph edge between observer and source
  observer.s.delete(source)

  // hmm could maybe happen when a source was force-destroyed if a child
  // tries to destroy its edge before recreating it (I don't think we ever do
  // that though)
  if (!source) return

  const edge = source.o.get(observer)

  // happens in React 18+ (see this method's jsdoc above)
  if (!edge) return

  source.o.delete(observer)

  // static dependencies don't change a node's weight
  if (!(edge.flags & Static)) {
    recalculateNodeWeight(-source.W, observer)
  }

  // Note: We don't remove scope added by the edge here. Once scope is added to
  // a graph node, it keeps that scope forever.

  if (isListeningTo(source.e, EDGE)) {
    sendEcosystemEvent(source.e, {
      action: 'remove',
      observer,
      source,
      type: EDGE,
    })
  }

  if (observer === source.L) {
    source.L = undefined
  } else {
    scheduleNodeDestruction(source)
  }
}

/**
 * Schedule all a node's dynamic, normal observers to run immediately.
 *
 * This should always be followed up by an `ecosystem._scheduler.flush()` call
 * unless we know for sure the scheduler is already running (e.g. when
 * `runSelector` is called and isn't initializing).
 */
export const scheduleDependents = (
  reason: Omit<InternalEvaluationReason, 's'> & {
    s: NonNullable<InternalEvaluationReason['s']>
  }
) => {
  for (const [observer, edge] of reason.s.o) {
    edge.flags & Static || observer.r(reason)
  }
}

/**
 * Schedule jobs to notify a node's event-aware observers of one or more events.
 * Event-aware observers include those added via `node.on()` and atom instances
 * that forward their `S`ignal's events.
 */
export const scheduleEventListeners = (
  reason: Omit<InternalEvaluationReason, 's'> & {
    s: NonNullable<InternalEvaluationReason['s']>
  }
) => {
  const pre = reason.s.e._scheduler.pre()

  for (const [observer, edge] of reason.s.o) {
    edge.flags & Eventless || observer.r(reason)
  }

  reason.s.e._scheduler.post(pre)
}

/**
 * Static deps don't update on state change, only on promise change or node
 * force-destruction. This currently flushes the scheduler immediately.
 */
export const scheduleStaticDependents = (
  reason: Omit<InternalEvaluationReason, 's'> & {
    s: NonNullable<InternalEvaluationReason['s']>
  }
) => {
  const pre = reason.s.e._scheduler.pre()

  for (const observer of reason.s.o.keys()) {
    observer.r(reason)
  }

  reason.s.e._scheduler.post(pre)
}

/**
 * When a node's refCount hits 0, schedule destruction of that node.
 */
export const scheduleNodeDestruction = (node: GraphNode) =>
  node.o.size - (node.L ? 1 : 0) || node.l !== ACTIVE || node.m()

export const setNodeStatus = (
  node: GraphNode,
  newStatus: InternalLifecycleStatus,
  templateKey?: string
) => {
  const oldStatus = node.l
  node.l = newStatus

  if (node.V && oldStatus === INITIALIZING && node.t) {
    // scoped nodes change their id after initial evaluation
    changeScopedNodeId(node.e, templateKey ?? node.t.key, node)
  }

  const isListeningToCycle = isListeningTo(node.e, CYCLE)

  if (
    newStatus === DESTROYED ||
    oldStatus !== INITIALIZING ||
    isListeningToCycle
  ) {
    const reason = {
      n: newStatus,
      o: oldStatus,
      r: node.w,
      s: node,
      t: Cycle,
    } as const

    if (isListeningTo(node.e, CYCLE)) {
      sendImplicitEcosystemEvent(node.e, reason)
    }

    if (newStatus === DESTROYED) {
      // Event observers don't prevent destruction so may still need cleaning up.
      // Schedule them so they can do so. Also if a node is force-destroyed, it
      // could still have observers. Inform them of the destruction so they can
      // recreate their source node.
      scheduleStaticDependents(reason)
    } else if (oldStatus !== INITIALIZING) {
      scheduleEventListeners(reason)
    }
  }
}
