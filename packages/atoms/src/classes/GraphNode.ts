import {
  AnyAtomTemplate,
  AtomGenerics,
  Cleanup,
  DehydrationFilter,
  GraphEdge,
  GraphEdgeConfig,
  InternalEvaluationReason,
  LifecycleStatus,
  NodeFilter,
  NodeFilterOptions,
} from '@zedux/atoms/types/index'
import { is, Job } from '@zedux/core'
import { Ecosystem } from './Ecosystem'
import { pluginActions } from '../utils/plugin-actions'
import { Destroy, EventSent, ExplicitExternal, Static } from '../utils/general'
import { AtomTemplateBase } from './templates/AtomTemplateBase'
import {
  ExplicitEvents,
  CatchAllListener,
  EventEmitter,
  SingleEventListener,
  ListenableEvents,
} from '../types/events'

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
  // If we're not force-destroying, don't destroy if there are dependents
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
        newState: node.get(),
        oldState,
        reasons: node.w,
      })
    )
  }

  // run the scheduler synchronously after any node state update
  events?.batch || node.e._scheduler.flush()
}

export const normalizeNodeFilter = (options?: NodeFilter) =>
  typeof options === 'object' && !is(options, AtomTemplateBase)
    ? (options as NodeFilterOptions)
    : { include: options ? [options as string | AnyAtomTemplate] : [] }

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

export abstract class GraphNode<
  G extends Pick<AtomGenerics, 'Events' | 'Params' | 'State' | 'Template'> = {
    Events: any
    Params: any
    State: any
    Template: any
  }
> implements Job, EventEmitter<G>
{
  /**
   * TS drops the entire `G`enerics type unless it's used somewhere in this
   * class definition. With this here, type helpers are able to infer any atom
   * generic (and even extra properties) from anything that extends GraphNode.
   *
   * This will never be populated. It's just for TS.
   */
  public _generics?: G

  /**
   * isZeduxNode - used internally to determine if objects are graph nodes.
   */
  public izn = true

  /**
   * @see Job.T
   */
  public T = 2 as const

  /**
   * @see Job.W
   */
  public W = 1

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

  on<E extends keyof ListenableEvents<G>>(
    eventName: E,
    callback: SingleEventListener<G, E>,
    edgeDetails?: GraphEdgeConfig
  ): Cleanup

  on(callback: CatchAllListener<G>, edgeDetails?: GraphEdgeConfig): Cleanup

  /**
   * Register a listener that will be called on this emitter's events.
   *
   * Internally, this manually adds a graph edge between this node and a new
   * external pseudo node.
   *
   * TODO: probably move this to the Signal class and remove the Events generic
   * from GraphNodes (events don't apply to selectors, effect nodes, or probably
   * lots of other future node types).
   */
  public on<E extends keyof ListenableEvents<G>>(
    eventNameOrCallback: E | ((eventMap: Partial<ListenableEvents<G>>) => void),
    callbackOrConfig?: SingleEventListener<G, E> | GraphEdgeConfig,
    maybeConfig?: GraphEdgeConfig
  ): Cleanup {
    const isSingleListener = typeof eventNameOrCallback === 'string'
    const eventName = isSingleListener ? eventNameOrCallback : ''

    const callback = isSingleListener
      ? (callbackOrConfig as SingleEventListener<G, E>)
      : (eventNameOrCallback as CatchAllListener<G>)

    const { f, op } = ((isSingleListener ? maybeConfig : callbackOrConfig) ||
      {}) as GraphEdgeConfig

    const operation = op || 'on'

    const notify = (reason: InternalEvaluationReason) => {
      // if `reason.t`ype doesn't exist, it's a change event
      const eventMap = (
        reason.t
          ? reason.e ?? {}
          : {
              ...reason.e,
              change: { newState: this.get(), oldState: reason.p },
            }
      ) as ListenableEvents<G>

      // if it's a single event listener and the event isn't in the map, ignore
      eventName in eventMap
        ? callback(eventMap[eventName] as any, eventMap)
        : isSingleListener || (callback as CatchAllListener<G>)(eventMap)
    }

    // External nodes can be disabled by setting this `m`ounted property to false
    notify.m = true

    const observer = new ExternalNode(
      this.e,
      this.e._idGenerator.generateNodeId(),
      notify,
      true
    )

    observer.u(this, operation, f ?? ExplicitExternal)

    return () => observer.k(this)
  }

  /**
   * A user-friendly wrapper for getting this node's `p`arams. Zedux uses the
   * obfuscated `p` property internally for efficiency, but end users should
   * prefer using `node.params`, invoking this getter.
   *
   * @see GraphNode.p
   */
  get params() {
    return this.p
  }

  /**
   * A user-friendly wrapper for getting this node's `t`emplate. Zedux uses the
   * obfuscated `t` property internally for efficiency, but end users should
   * prefer using `node.template`, invoking this getter.
   *
   * @see GraphNode.t
   */
  get template() {
    return this.t
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
  public c?: Cleanup

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
   *
   * This is made to be universally compatible with all Zedux's built-in node
   * classes. Custom nodes (e.g. that extend `Signal`) may need to override it
   */
  public f(options?: NodeFilter): boolean | undefined | void {
    const { id, t } = this
    const lowerCaseId = id.toLowerCase()
    const {
      exclude = [],
      excludeFlags = [],
      include = [],
      includeFlags = [],
    } = normalizeNodeFilter(options)

    const isExcluded =
      exclude.some(templateOrKey =>
        typeof templateOrKey === 'string'
          ? lowerCaseId.includes(templateOrKey.toLowerCase())
          : (t?.key && (templateOrKey as AtomTemplateBase)?.key === t?.key) ||
            templateOrKey === t
      ) || excludeFlags.some(flag => t.flags?.includes(flag))

    return (
      !isExcluded &&
      ((!include.length && !includeFlags.length) ||
        include.some(templateOrKey =>
          typeof templateOrKey === 'string'
            ? lowerCaseId.includes(templateOrKey.toLowerCase())
            : (t?.key && (templateOrKey as AtomTemplateBase)?.key === t?.key) ||
              templateOrKey === t
        ) ||
        includeFlags.some(flag => t.flags?.includes(flag)))
    )
  }

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
  public abstract j(): void

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
  public o = new Map<GraphNode, GraphEdge>()

  /**
   * `p`arams - a reference to the exact params passed to this node. These never
   * change except:
   *
   * TODO: when a node is passed as a param to another node. In that case, the
   * ref will be swapped out if it's destroyed.
   */
  public abstract p: G['Params']

  /**
   * `r`un - evaluate the graph node. If its value "changes", this in turn runs
   * this node's dependents, recursing down the graph tree.
   *
   * If `defer` is true, make the scheduler set a timeout to run the evaluation.
   */
  public abstract r(reason: InternalEvaluationReason, defer?: boolean): void

  /**
   * `s`ources - a map of the edges drawn between this node and all of its
   * dependencies, keyed by the GraphNode object reference of the source. Every
   * edge stored here is reverse-mapped - the exact same object reference will
   * also be stored in another node's `o`bservers.
   */
  public s = new Map<GraphNode, GraphEdge>()

  /**
   * `t`emplate - a reference to the template that was used to create this node
   * - e.g. an `AtomTemplate` instance for atom instances or an
   * AtomSelectorOrConfig function or object for selector instances.
   */
  public abstract t: G['Template']

  /**
   * `w`hy - the list of reasons explaining why this graph node updated or is
   * going to update.
   */
  public w: InternalEvaluationReason[] = []
}

export class ExternalNode extends GraphNode {
  /**
   * @see GraphNode.T
   */
  public T = 3 as 2 // temporary until we sort out new graph algo

  /**
   * `b`ufferedEvents - the list of buffered events that will be batched
   * together when this node's `j`ob runs. Only applies if
   * `this.I`sEventListener
   */
  public b?: Record<string, any>

  /**
   * `i`nstance - the single source node this external node is observing
   */
  public i?: GraphNode

  /**
   * @see GraphNode.p external nodes don't have params
   */
  public p: undefined

  /**
   * @see GraphNode.t external nodes don't have templates
   */
  public t: undefined

  constructor(
    /**
     * @see GraphNode.e
     */
    public readonly e: Ecosystem,

    /**
     * @see GraphNode.id
     */
    public readonly id: string,

    /**
     * `n`otify - tell the creator of this external node there's an update.
     */
    public readonly n: ((reason: InternalEvaluationReason) => void) & {
      m?: boolean
    },

    /**
     * `I`sEventListener - currently there are only two "types" of ExternalNodes
     *
     * - nodes that listen to state/promise/lifecycle updates
     * - nodes that listen to events
     *
     * Each has slightly different functionality. We could use another subclass
     * for this, but for now, just use a boolean to track which type this
     * ExternalNode is.
     */
    public I?: boolean
  ) {
    super()

    // This is the simplest way to ensure that observers run in the order they
    // were added in. The idCounter was always just incremented to create this
    // node's id. ExternalNodes always run after all internal jobs are fully
    // flushed, so tracking graph node "weight" in `this.W`eight is useless.
    // Track listener added order instead.
    this.W = e._idGenerator.idCounter
    e.n.set(id, this)
    setNodeStatus(this, 'Active')
  }

  /**
   * @see GraphNode.destroy
   */
  public destroy(skipUpdate?: boolean) {
    if (!this.i) return
    if (this.w.length) this.e._scheduler.unschedule(this)

    // external nodes only have one source, no observers
    removeEdge(this, this.i!)

    this.i = undefined
    this.e.n.delete(this.id)
    setNodeStatus(this, 'Destroyed')

    // notify the external observer of the destruction if needed (does nothing
    // if the external observer initiated the destruction)
    skipUpdate || this.j()
  }

  /**
   * @see GraphNode.get external nodes have no own value. Their "value" is the
   * value of the single node they depend on. Access that directly instead.
   */
  public get() {}

  /**
   * @see GraphNode.d can't dehydrate external nodes
   */
  public d() {}

  /**
   * @see GraphNode.f `ecosystem.findAll()` never returns external nodes
   */
  public f() {}

  /**
   * @see GraphNode.j can't hydrate external nodes
   */
  public h() {}

  /**
   * @see GraphNode.j
   */
  public j() {
    if (this.n.m) {
      for (const reason of this.w) {
        this.n(reason)
      }
    }
    this.w = []
  }

  /**
   * `k`illEdge - removes an edge between this node and the passed source node.
   *
   * External nodes only point to one source node. However, they can swap out
   * which node they point to. We do that by first adding the new dep, then
   * removing the old one by calling this method. So an external node can
   * actually point to two source nodes momentarily.
   *
   * If the passed source is the only source, calling this method also destroys
   * the external node. This setup is the simplest way to give React what it
   * wants esp. in strict mode (usage in React hooks is currently the primary
   * purpose of external nodes).
   */
  public k(source: GraphNode) {
    removeEdge(this, source)
    source === this.i && this.destroy(true)
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
    // always update if `I`sEventListener. Ignore `EventSent` reasons otherwise.
    if (this.I || (!this.I && reason.t !== EventSent)) {
      if (this.I) {
        this.b = this.b ? { ...this.b, ...reason.e } : reason.e
      }

      // We can optimize this for event listeners by telling ExternalNode the
      // event it's listening to and short-circuiting here, before scheduling a
      // useless job, if the event isn't present (and isn't an ImplicitEvent
      // that won't be present on `reason.e`). TODO: investigate.
      this.w.push(reason) === 1 && this.e._scheduler.schedule(this, defer)
    }
  }

  /**
   * `u`pdateEdge - ExternalNodes maintain a single edge on a source node. But
   * the source can change. Call this to update it if needed.
   */
  public u(source: GraphNode, operation: string, flags: number) {
    this.i && removeEdge(this, this.i)

    this.i = source

    addEdge(this, source, {
      createdAt: this.e._idGenerator.now(),
      flags,
      operation: operation,
    })
  }
}
