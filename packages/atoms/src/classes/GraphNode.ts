import {
  DependentEdge,
  DehydrationFilter,
  NodeFilter,
  LifecycleStatus,
  EvaluationReason,
  EvaluationType,
  GraphEdgeSignal,
  NodeFilterOptions,
  AnyAtomTemplate,
  DependentCallback,
  Cleanup,
  AtomGenerics,
  GraphEdgeDetails,
} from '@zedux/atoms/types/index'
import { is } from '@zedux/core'
import { Ecosystem } from './Ecosystem'
import { pluginActions } from '../utils/plugin-actions'
import { ExplicitExternal, External, prefix, Static } from '../utils/general'
import { AtomTemplateBase } from './templates/AtomTemplateBase'

/**
 * Actually add an edge to the graph. When we buffer graph updates, we're
 * really just deferring the calling of this method.
 */
export const addEdge = (
  dependentId: string,
  dependency: GraphNode,
  newEdge: DependentEdge,
  dependent = dependency.e.n.get(dependentId)
) => {
  const { _mods, modBus } = dependency.e

  // draw the edge in both nodes. Dependent may not exist if it's an external
  // pseudo-node
  if (!(newEdge.flags & External) && dependent) {
    dependent.s.set(dependency.id, newEdge)
  }

  dependency.o.set(dependentId, newEdge)
  dependency.c?.()

  if (_mods.edgeCreated) {
    modBus.dispatch(
      pluginActions.edgeCreated({
        dependency,
        dependent: dependent || dependentId, // unfortunate but not changing for now
        edge: newEdge,
      })
    )
  }

  return newEdge
}

export const destroyNodeStart = (node: GraphNode, force?: boolean) => {
  // If we're not force-destroying, don't destroy if there are dependents
  if (node.l === 'Destroyed' || (!force && node.o.size)) return

  node.c?.()
  node.c = undefined

  setNodeStatus(node, 'Destroyed')

  if (node.w.length) node.e._scheduler.unschedule(node.j)

  return true
}

// TODO: merge this into destroyNodeStart. We should be able to
export const destroyNodeFinish = (node: GraphNode) => {
  // first remove all edges between this node and its dependencies
  for (const dependencyKey of node.s.keys()) {
    removeEdge(node.id, node.e.n.get(dependencyKey)!, node)
  }

  // if an atom instance is force-destroyed, it could still have dependents.
  // Inform them of the destruction
  scheduleDependents(
    node,
    undefined,
    undefined,
    true,
    'node destroyed',
    'Destroyed',
    true
  )

  // now remove all edges between this node and its dependents
  for (const dependentId of node.o.keys()) {
    const dependentNode = node.e.n.get(dependentId)

    // dependent won't exist if it's external
    dependentNode && dependentNode.s.delete(node.id)

    // we _probably_ don't need to send edgeRemoved mod events to plugins for
    // these - it's better that they receive the duplicate edgeCreated event
    // when the dependency is recreated by its dependent(s) so they can infer
    // that the edge was "moved"
  }

  node.e.n.delete(node.id)
}

export const normalizeNodeFilter = (options?: NodeFilter) =>
  typeof options === 'object' && !is(options, AtomTemplateBase)
    ? (options as NodeFilterOptions)
    : { include: options ? [options as string | AnyAtomTemplate] : [] }

/**
 * Remove the graph edge between two nodes. The dependent may not exist as a
 * node in the graph if it's external, e.g. a React component
 *
 * For some reason in React 18+, React destroys parents before children. This
 * means a parent EcosystemProvider may have already unmounted and wiped the
 * whole graph; this edge may already be destroyed.
 */
export const removeEdge = (
  dependentId: string,
  dependency: GraphNode,
  dependent = dependency.e.n.get(dependentId)
) => {
  // erase graph edge between dependent and dependency
  dependent && dependent.s.delete(dependency.id)

  // hmm could maybe happen when a dependency was force-destroyed if a child
  // tries to destroy its edge before recreating it (I don't think we ever do
  // that though)
  if (!dependency) return

  const dependentEdge = dependency.o.get(dependentId)

  // happens in React 18+ (see this method's jsdoc above)
  if (!dependentEdge) return

  dependency.o.delete(dependentId)

  const { _mods, _scheduler, modBus } = dependency.e

  if (dependentEdge.task) {
    _scheduler.unschedule(dependentEdge.task)
  }

  if (_mods.edgeRemoved) {
    modBus.dispatch(
      pluginActions.edgeRemoved({
        dependency,
        dependent: dependent || dependentId,
        edge: dependentEdge,
      })
    )
  }

  scheduleNodeDestruction(dependency)
}

export const scheduleDependents = (
  node: GraphNode,
  newState: any,
  oldState: any,
  defer?: boolean,
  type: EvaluationType = 'state changed',
  signal: GraphEdgeSignal = 'Updated',
  scheduleStaticDeps = false
) => {
  const { n, _scheduler } = node.e

  for (const [dependentId, dependentEdge] of node.o.entries()) {
    // if edge.task exists, this edge has already been scheduled
    if (dependentEdge.task) {
      if (signal !== 'Destroyed') continue

      // destruction jobs supersede update jobs; cancel the existing job so we
      // can create a new one for the destruction
      _scheduler.unschedule(dependentEdge.task)
    }

    // Static deps don't update on state change. Dynamic deps don't update on
    // promise change. Both types update on instance force-destruction
    const isStatic = dependentEdge.flags & Static
    if (isStatic && !scheduleStaticDeps) continue

    const reason: EvaluationReason = {
      newState,
      oldState,
      operation: dependentEdge.operation,
      reasons: node.w,
      sourceId: node.id,
      // TODO: get rid of sourceType. Plugins can easily infer it from
      // `ecosystem.n`odes given the sourceId
      sourceType: 'Atom',
      type,
    }

    // let internal dependents (other atoms and AtomSelectors) schedule their
    // own jobs
    if (!(dependentEdge.flags & External)) {
      n.get(dependentId)?.r(reason, defer)
      continue
    }

    // schedule external dependents
    const task = () => {
      dependentEdge.task = undefined
      dependentEdge.callback?.(
        signal,
        // don't use the snapshotted newState above
        node.get(),
        reason
      )
    }

    _scheduler.schedule(
      {
        flags: dependentEdge.flags,
        task,
        type: 3, // UpdateExternalDependent (3)
      },
      defer
    )

    // mutate the edge; give it the scheduled task so it can be cleaned up
    dependentEdge.task = task
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

export abstract class GraphNode<
  G extends Pick<AtomGenerics, 'State'> = { State: any }
> {
  public static $$typeof = Symbol.for(`${prefix}/GraphNode`)

  /**
   * Detach this node from the ecosystem and clean up all graph edges and other
   * subscriptions/effects created by this node.
   *
   * Destruction will bail out if this node still has dependents (`node.o.size
   * !== 0`). Pass `true` to force-destroy the node anyway.
   *
   * When force-destroying a node that still has dependents, the node will be
   * immediately recreated and all dependents notified of the destruction.
   */
  public abstract destroy(force?: boolean): void

  /**
   * Get the current value of this node.
   */
  public abstract get(): G['State']

  /**
   * The unique id of this node in the graph. Zedux always tries to make this
   * somewhat human-readable for easier debugging.
   */
  public abstract id: string

  // TODO: Add overloads for specific events. Also add a `passive` option for
  // listeners that don't prevent destruction
  public on(
    eventName: GraphEdgeSignal,
    callback: DependentCallback,
    edgeDetails?: GraphEdgeDetails & { i?: string }
  ): Cleanup

  public on(
    callback: DependentCallback,
    edgeDetails?: GraphEdgeDetails & { i?: string }
  ): Cleanup

  // Putting this here for now. TS drops the entire `G`enerics type unless it's
  // used somewhere in this class definition. With this here, type helpers are
  // able to infer any atom generic (and even extra properties) from anything
  // that extends GraphNode
  public on(placeholder: never): G

  /**
   * Register a listener that will be called on this node's events.
   *
   * Internally, this manually adds a graph edge between this node and a new
   * external pseudo node.
   */
  public on(
    eventNameOrCallback: string | DependentCallback,
    callbackOrOperation?:
      | DependentCallback
      | (GraphEdgeDetails & { i?: string }),
    maybeConfig?: GraphEdgeDetails & { i?: string }
  ): Cleanup | G {
    const isFirstOverload = typeof eventNameOrCallback === 'string'
    const eventName = isFirstOverload ? eventNameOrCallback : ''

    const callback = isFirstOverload
      ? (callbackOrOperation as DependentCallback)
      : (eventNameOrCallback as DependentCallback)

    const config = ((isFirstOverload ? maybeConfig : callbackOrOperation) ||
      {}) as GraphEdgeDetails & { i?: string }

    const id = config.i || this.e._idGenerator.generateNodeId()

    addEdge(id, this, {
      callback: (signal, val, reason) =>
        (!eventName || eventName === signal) && callback(signal, val, reason),
      createdAt: this.e._idGenerator.now(),
      flags: config.f ?? ExplicitExternal,
      operation: config.op || 'on',
    })

    return () => removeEdge(id, this)
  }

  // Internal fields - these are public and stable, but normal users should
  // never need to use these. So use single-letter property names for efficiency
  // and (kind of) obfuscation:

  /**
   * `c`ancelDestruction - when a node's refCount hits 0, we schedule
   * destruction of that node. If that destruction is still pending and the
   * refCount goes back up to 1, we call this to cancel the scheduled
   * destruction.
   */
  public c?: () => void

  /**
   * `d`ehydrate - a function called internally by `ecosystem.dehydrate()` to
   * transform the node's value into a serializable form.
   */
  public abstract d(options?: DehydrationFilter): any

  /**
   * `e`cosystem - a reference to the ecosystem that created this node
   */
  public abstract e: Ecosystem

  /**
   * `f`ilter - a function called internally by `ecosystem.findAll()` to
   * determine whether this node should be included in the output. Also
   * typically called by `node.d`ehydrate to perform its filtering logic.
   */
  public abstract f(options?: NodeFilter): boolean

  /**
   * `h`ydrate - a function called internally by `ecosystem.hydrate()` to
   * transform a previously-serialized value and set it as the node's new value.
   *
   * If the node doesn't support hydration, it can make this a no-op.
   */
  public abstract h(serializedValue: any): any

  /**
   * `j`ob - The callback this node uses to schedule evaluation jobs. Used to
   * cancel the job if the node is destroyed before it can run.
   *
   * This property may go away if we ever move fully off of node update
   * scheduling
   */
  public abstract j: () => void

  /**
   * `l`ifecycleStatus - a string indicating the node's current state in its
   * lifecycle status "state machine":
   *
   * Initializing -> Active [<-> Stale] -> Destroyed
   */
  public l: LifecycleStatus = 'Initializing'

  /**
   * `m`aybeDestroy - destroys or schedules destruction of the node.
   *
   * If the node supports destruction deferring (like atom instances with a
   * non-zero `ttl`), this will set the node's `l`ifecycleStatus to `Stale`, set
   * up the timeout, promise, or observable that will ultimately destroy it, and
   * set up means to cancel destruction and return to `Active` status.
   *
   * If (like selectors or atom instances with a `ttl` of 0) the node doesn't
   * support destruction deferring, this method should simply call
   * `this.destroy()`, destroying the node immediately.
   *
   * Nodes are free to bail out of destruction completely - like atom instances
   * with no `ttl` set.
   */
  public abstract m(): void

  /**
   * `o`bservers - a map of the edges drawn between this node and all of its
   * dependents, keyed by id. Most edges stored here are reverse-mapped - the
   * exact same object reference will also be stored in another node's
   * `s`ources. The only exception is pseudo-nodes.
   */
  public o = new Map<string, DependentEdge>()

  /**
   * `r`un - evaluate the graph node. If its value "changes", this in turn runs
   * this node's dependents, recursing down the graph tree.
   *
   * If `defer` is true, schedule the evaluation rather than running it right
   * away
   */
  public abstract r(reason: EvaluationReason, defer?: boolean): void

  /**
   * `s`ources - a map of the edges drawn between this node and all of its
   * dependencies, keyed by id. Every edge stored here is reverse-mapped - the
   * exact same object reference will also be stored in another node's
   * `o`bservers.
   */
  public s = new Map<string, DependentEdge>()

  /**
   * `w`hy - the list of reasons explaining why this graph node updated or is
   * going to update.
   */
  public w: EvaluationReason[] = []
}
