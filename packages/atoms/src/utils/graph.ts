import {
  AtomGenerics,
  GraphEdge,
  InternalEvaluationReason,
  LifecycleStatus,
} from '@zedux/atoms/types/index'
import { type GraphNode } from '../classes/GraphNode'
import { SendableEvents } from '../types/events'
import { pluginActions } from './plugin-actions'
import { Cycle, Eventless, Static } from './general'

/**
 * Actually add an edge to the graph. When we buffer graph updates, we're
 * really just deferring the calling of this method.
 */
export const addEdge = (
  dependent: GraphNode,
  dependency: GraphNode,
  newEdge: GraphEdge
) => {
  const { _mods, modBus } = dependency.e

  // draw the edge in both nodes
  dependent.s.set(dependency, newEdge)
  dependency.o.set(dependent, newEdge)
  dependency.c?.()

  // Static sources don't change a node's weight
  if (!(newEdge.flags & Static)) {
    recalculateNodeWeight(dependency.W, dependent)
  }

  if (_mods.edgeCreated) {
    modBus.dispatch(
      pluginActions.edgeCreated({
        dependency,
        dependent: dependent, // unfortunate but not changing for now
        edge: newEdge,
      })
    )
  }

  return newEdge
}

export const destroyNodeStart = (node: GraphNode, force?: boolean) => {
  // If we're not force-destroying, don't destroy if there are dependents. Also
  // don't destroy of `node.K`eep is set
  if (node.l === 'Destroyed' || (!force && node.o.size - (node.L ? 1 : 0))) {
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

  setNodeStatus(node, 'Destroyed')
}

export const handleStateChange = <
  G extends Pick<AtomGenerics, 'Events' | 'State'>
>(
  node: GraphNode<G & { Params: any; Template: any }>,
  oldState: G['State'],
  events?: Partial<SendableEvents<G>>
) => {
  const pre = node.e._scheduler.pre()
  scheduleDependents({ e: events, n: node.v, o: oldState, r: node.w, s: node })

  if (node.e._mods.stateChanged) {
    node.e.modBus.dispatch(
      pluginActions.stateChanged({
        node,
        newState: node.v,
        oldState,
        reasons: node.w,
      })
    )
  }

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
 * Remove the graph edge between two nodes. The dependent may not exist as a
 * node in the graph if it's external, e.g. a React component
 *
 * For some reason in React 18+, React destroys parents before children. This
 * means a parent EcosystemProvider may have already unmounted and wiped the
 * whole graph; this edge may already be destroyed.
 */
export const removeEdge = (dependent: GraphNode, dependency: GraphNode) => {
  // erase graph edge between dependent and dependency
  dependent.s.delete(dependency)

  // hmm could maybe happen when a dependency was force-destroyed if a child
  // tries to destroy its edge before recreating it (I don't think we ever do
  // that though)
  if (!dependency) return

  const edge = dependency.o.get(dependent)

  // happens in React 18+ (see this method's jsdoc above)
  if (!edge) return

  dependency.o.delete(dependent)

  // static dependencies don't change a node's weight
  if (!(edge.flags & Static)) {
    recalculateNodeWeight(-dependency.W, dependent)
  }

  if (dependency.e._mods.edgeRemoved) {
    dependency.e.modBus.dispatch(
      pluginActions.edgeRemoved({
        dependency,
        dependent: dependent,
        edge: edge,
      })
    )
  }

  if (dependent === dependency.L) {
    dependency.L = undefined
  } else {
    scheduleNodeDestruction(dependency)
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
    edge.flags & Static || observer.r(reason, false)
  }
}

/**
 * Schedule jobs to notify a node's event-aware observers of one or more events.
 * Event-aware observers include those added via `node.on()` and atom instances
 * that forward their `S`ignal's events.
 *
 * This should always be followed up by an `ecosystem._scheduler.flush()` call
 * unless we know for sure the scheduler is already running (e.g. when
 * `runSelector` is called and isn't initializing).
 */
export const scheduleEventListeners = (
  reason: Omit<InternalEvaluationReason, 's'> & {
    s: NonNullable<InternalEvaluationReason['s']>
  }
) => {
  for (const [observer, edge] of reason.s.o) {
    edge.flags & Eventless || observer.r(reason, false)
  }
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
  for (const observer of reason.s.o.keys()) {
    observer.r(reason, false)
  }

  reason.s.e._scheduler.flush()
}

/**
 * When a node's refCount hits 0, schedule destruction of that node.
 */
export const scheduleNodeDestruction = (node: GraphNode) =>
  node.o.size - (node.L ? 1 : 0) || node.l !== 'Active' || node.m()

export const setNodeStatus = (node: GraphNode, newStatus: LifecycleStatus) => {
  const oldStatus = node.l
  node.l = newStatus

  if (node.e._mods.statusChanged) {
    node.e.modBus.dispatch(
      pluginActions.statusChanged({
        newStatus,
        node,
        oldStatus,
      })
    )
  }

  if (newStatus === 'Destroyed') {
    // Event observers don't prevent destruction so may still need cleaning up.
    // Schedule them so they can do so. Also if a node is force-destroyed, it
    // could still have observers. Inform them of the destruction so they can
    // recreate their source node.
    scheduleStaticDependents({
      n: newStatus,
      o: oldStatus,
      r: node.w,
      s: node,
      t: Cycle,
    })
  } else if (oldStatus !== 'Initializing') {
    scheduleEventListeners({
      n: newStatus,
      o: oldStatus,
      r: node.w,
      s: node,
      t: Cycle,
    })

    // flushing here should be fine - `setNodeStatus` is only called during
    // React component renders when `oldStatus` is Initializing
    node.e._scheduler.flush()
  }
}
