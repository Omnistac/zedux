import {
  AtomGenerics,
  GraphEdge,
  InternalEvaluationReason,
  LifecycleStatus,
} from '@zedux/atoms/types/index'
import { type GraphNode } from '../classes/GraphNode'
import { ExplicitEvents } from '../types/events'
import { pluginActions } from './plugin-actions'
import { Destroy, Static } from './general'

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

  // draw the edge in both nodes. Dependent may not exist if it's an external
  // pseudo-node
  dependent && dependent.s.set(dependency, newEdge)
  dependency.o.set(dependent, newEdge)
  dependency.c?.()

  // static dependencies don't change a node's weight
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
  if (node.l === 'Destroyed' || (!force && node.o.size)) return

  node.c?.()
  node.c = undefined

  setNodeStatus(node, 'Destroyed')

  if (node.w.length) node.e._scheduler.unschedule(node)

  return true
}

// TODO: merge this into destroyNodeStart. We should be able to
export const destroyNodeFinish = (node: GraphNode) => {
  // first remove all edges between this node and its dependencies
  for (const dependency of node.s.keys()) {
    removeEdge(node, dependency)
  }

  // if an atom instance is force-destroyed, it could still have dependents.
  // Inform them of the destruction
  scheduleDependents(
    {
      r: node.w,
      s: node,
      t: Destroy,
    },
    true,
    true
  )

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
}

export const handleStateChange = <
  G extends Pick<AtomGenerics, 'Events' | 'State'>
>(
  node: GraphNode<G & { Params: any; Template: any }>,
  oldState: G['State'],
  events?: Partial<G['Events'] & ExplicitEvents>
) => {
  scheduleDependents({ e: events, p: oldState, r: node.w, s: node }, false)

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
  events?.batch || node.e._scheduler.flush()
}

const recalculateNodeWeight = (weightDiff: number, node?: GraphNode) => {
  if (!node) return // happens when node is external

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
  dependent && dependent.s.delete(dependency)

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

  scheduleNodeDestruction(dependency)
}

export const scheduleDependents = (
  reason: Omit<InternalEvaluationReason, 's'> & {
    s: NonNullable<InternalEvaluationReason['s']>
  },
  defer?: boolean,
  scheduleStaticDeps?: boolean
) => {
  for (const [observer, edge] of reason.s.o) {
    // Static deps don't update on state change, only on promise change or node
    // force-destruction
    if (scheduleStaticDeps || !(edge.flags & Static)) observer.r(reason, defer)
  }
}

/**
 * When a node's refCount hits 0, schedule destruction of that node.
 */
export const scheduleNodeDestruction = (node: GraphNode) =>
  node.o.size || node.l !== 'Active' || node.m()

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
}
