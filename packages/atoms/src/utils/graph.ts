import {
  AtomGenerics,
  GraphEdge,
  InternalEvaluationReason,
  Scope,
} from '@zedux/atoms/types/index'
import { type Ecosystem } from '../classes/Ecosystem'
import { type ZeduxNode } from '../classes/ZeduxNode'
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
import { schedulerPost, schedulerPre } from './ecosystem'
import { getSelectorKey } from './selectors'

const changeScopedNodeId = (
  ecosystem: Ecosystem,
  templateKey: string,
  newNode: ZeduxNode
) => {
  // if this is the first scoped node of its template to evaluate, record the
  // scope all future instances of the template will need to be provided
  ecosystem.s ??= {}
  ecosystem.s[templateKey] ??= [...newNode.V!.keys()]

  // give the new scoped node a `@scope()`-suffixed id
  const scopedId = `${newNode.id}-${getScopeString(ecosystem, newNode.V!)}`

  newNode.id = scopedId
}

/**
 * Actually add an edge to the graph. When we buffer graph updates, we're
 * really just deferring the calling of this function.
 */
export const addEdge = (
  observer: ZeduxNode,
  source: ZeduxNode,
  newEdge: GraphEdge
) => {
  // draw the edge in both nodes
  observer.s.set(source, newEdge)
  source.o.set(observer, newEdge)
  source.c?.()

  // Static sources don't change a node's weight
  if (!(newEdge.flags & Static)) observer.R = resolveWeight

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
}

/**
 * Add a reason to the node's `w`hy linked list. Returns true if this was the
 * first reason added, meaning a job should be scheduled to process this update.
 */
export const addReason = (
  node: ZeduxNode | Ecosystem,
  reason: InternalEvaluationReason
) => {
  if (!node.w) {
    node.w = node.wt = reason
    return true
  }

  // a reason reference is shared to all observers so we can't mutate it
  // per-observer. Wrap them if a node gets more than one evaluation reason.
  // This optimizes the most common case: 1 reason.
  if (node.w === node.wt) {
    node.w = node.wt = { r: node.w }
  }

  node.wt!.l = node.wt = { r: reason }
}

export const destroyNodeStart = (node: ZeduxNode, force?: boolean) => {
  // If we're not force-destroying, don't destroy if there are non-passive
  // observers.
  if (node.l === DESTROYED || (!force && node.o.size - (node.L ? 1 : 0))) {
    return
  }

  node.c?.()
  node.c = undefined

  if (node.w) node.e.syncScheduler.unschedule(node)

  return true
}

// TODO: merge this into destroyNodeStart. We should be able to
export const destroyNodeFinish = (node: ZeduxNode) => {
  // first remove all edges between this node and its sources
  for (const dependency of node.s.keys()) {
    removeEdge(node, dependency)
  }

  // now remove all edges between this node and its observers
  for (const [observer, edge] of node.o) {
    if (!(edge.flags & Static)) {
      markForWeightRecalculation(observer)
    }

    observer.s.delete(node)

    // we _probably_ don't need to send edgeRemoved mod events to plugins for
    // these - it's better that they receive the duplicate edgeCreated event
    // when the dependency is recreated by its dependent(s) so they can infer
    // that the edge was "moved"
  }

  node.e.n.delete(node.id)

  setNodeStatus(node, DESTROYED)

  // override `node.r` so the destroyed node can't be scheduled. This is a micro
  // optimization that prevents `ZeduxNode#r`un, which is in Zedux's hot path,
  // from having to check if destroyed on every run.
  node.r = () => {}
}

/**
 * Creates a consistent hash for the passed scope's contextual values.
 *
 * TODO: add this method to the ecosystem so it can be used with `.makeId` and
 * `.hash` to manually construct every part of an id exactly the same as Zedux
 * does internally.
 */
export const getScopeString = (ecosystem: Ecosystem, scope: Scope) => {
  const contextValueStrings = [...scope.values()].map(val => {
    const resolvedVal =
      val?.constructor?.name === WeakRef.name
        ? (val as WeakRef<any>).deref()
        : val

    return (resolvedVal as ZeduxNode)?.izn
      ? (resolvedVal as ZeduxNode).id
      : ecosystem.hash(resolvedVal, true)
  })

  return `@scope(${contextValueStrings})`
}

export const handleStateChange = <
  G extends Pick<AtomGenerics, 'Events' | 'State'>
>(
  node: ZeduxNode<G & { Params: any; Template: any }>,
  oldState: G['State'],
  events?: Partial<SendableEvents<G>>
) => {
  scheduleDependents({ e: events, n: node.v, o: oldState, r: node.w, s: node })
}

export const handleStateChangeWithEvent = <
  G extends Pick<AtomGenerics, 'Events' | 'State'>
>(
  node: ZeduxNode<G & { Params: any; Template: any }>,
  oldState: G['State'],
  events?: Partial<SendableEvents<G>>
) => {
  const reason = { e: events, n: node.v, o: oldState, r: node.w, s: node }

  if (isListeningTo(node.e, CHANGE)) {
    sendImplicitEcosystemEvent(node.e, reason)
  }

  scheduleDependents(reason)
}

/**
 * Mark a node and its observers (recursively) for weight recalculation
 */
export const markForWeightRecalculation = (node: ZeduxNode) => {
  if (node.R) return

  node.R = resolveWeight

  const observers = node.o.keys()
  let observer

  while ((observer = observers.next().value)) {
    markForWeightRecalculation(observer as ZeduxNode)
  }
}

/**
 * Remove the graph edge between two nodes.
 *
 * For some reason in React 18+, React destroys parents before children. This
 * means a parent EcosystemProvider may have already unmounted and wiped the
 * whole graph; this edge may already be destroyed.
 */
export const removeEdge = (observer: ZeduxNode, source: ZeduxNode) => {
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
    observer.R = resolveWeight
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
 * Lazily recalculate a node's weight when needed
 */
export const resolveWeight = (node: ZeduxNode) => {
  node.R = undefined

  const entries = node.s.entries()
  node.W = 1
  let entry

  while ((entry = entries.next().value)) {
    // static sources don't affect a node's weight
    if (!(entry[1].flags & Static)) {
      if (entry[0].R) resolveWeight(entry[0])

      node.W += entry[0].W
    }
  }
}

/**
 * Schedule all a node's dynamic, normal observers to run immediately.
 *
 * This should always be followed up by an `ecosystem.syncScheduler.flush()`
 * call unless we know for sure the scheduler is already running (e.g. when
 * `runSelector` is called and isn't initializing).
 */
export const scheduleDependents = (
  reason: Omit<InternalEvaluationReason, 's'> & {
    s: NonNullable<InternalEvaluationReason['s']>
  }
) => {
  const entries = reason.s.o.entries()
  let observer

  while ((observer = entries.next().value)) {
    observer[1].flags & Static || observer[0].r(reason)
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
  schedulerPre(reason.s.e)

  for (const [observer, edge] of reason.s.o) {
    edge.flags & Eventless || observer.r(reason)
  }

  schedulerPost(reason.s.e)
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
  schedulerPre(reason.s.e)

  for (const observer of reason.s.o.keys()) {
    observer.r(reason)
  }

  schedulerPost(reason.s.e)
}

/**
 * When a node's refCount hits 0, schedule destruction of that node.
 */
export const scheduleNodeDestruction = (node: ZeduxNode) =>
  node.o.size - (node.L ? 1 : 0) || node.l !== ACTIVE || node.m()

export const setNodeStatus = (
  node: ZeduxNode,
  newStatus: InternalLifecycleStatus
) => {
  const oldStatus = node.l
  node.l = newStatus

  if (node.V && oldStatus === INITIALIZING && node.t) {
    // scoped nodes change their id after initial evaluation
    changeScopedNodeId(
      node.e,
      'key' in node.t ? node.t.key : getSelectorKey(node.e, node.t),
      node
    )
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

    if (isListeningToCycle) {
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
