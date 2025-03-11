import {
  AnyAtomTemplate,
  AnyNodeGenerics,
  Cleanup,
  DehydrationFilter,
  GraphEdge,
  GraphEdgeConfig,
  InternalEvaluationReason,
  Job,
  ListenerConfig,
  NodeFilter,
  NodeFilterOptions,
  NodeGenerics,
} from '@zedux/atoms/types/index'
import { Ecosystem } from './Ecosystem'
import {
  ACTIVE,
  DESTROYED,
  Eventless,
  EventSent,
  ExplicitExternal,
  INITIALIZING,
  InternalLifecycleStatus,
  is,
  StatusMap,
} from '../utils/general'
import { AtomTemplateBase } from './templates/AtomTemplateBase'
import {
  CatchAllListener,
  EventEmitter,
  SingleEventListener,
  ListenableEvents,
} from '../types/events'
import { bufferEdge, getEvaluationContext } from '../utils/evaluationContext'
import { addEdge, addReason, removeEdge, setNodeStatus } from '../utils/graph'
import { parseOnArgs, shouldScheduleImplicit } from '../utils/events'
import { scheduleSync } from '../utils/ecosystem'

export abstract class ZeduxNode<G extends NodeGenerics = AnyNodeGenerics>
  implements Job, EventEmitter<G>
{
  /**
   * TS drops the entire `G`enerics type unless it's used somewhere in this
   * class definition. With this here, type helpers are able to infer any atom
   * generic (and even extra properties) from anything that extends ZeduxNode.
   *
   * This will never be populated. It's just for TS.
   */
  public _generics?: G

  /**
   * isZeduxNode - used internally to determine if objects are graph nodes.
   */
  public izn = true

  /**
   * `L`istenerNode - the single event listener node of this graph node.
   */
  public L: undefined | Listener = undefined

  /**
   * @see Job.T
   */
  public T = 2 as const

  /**
   * scope`V`alues - maps contexts (e.g. React context objects or atom
   * templates) to their resolved, provided values. This is the "scope" of this
   * graph node - these values need to be provided for this node and its entire
   * tree of source nodes (a node's scope contains all provided context values
   * used by it and any of its sources).
   *
   * When `inject` is called in a state factory, it makes the atom scoped - the
   * atom evaluation will throw an error unless the value was provided either
   * via React context in React or `ecosystem.withScope`.
   *
   * When the atom reevaluates normally, these cached values are retrieved.
   *
   * When the atom is retrieved from React or another scoped context (like
   * `ecosystem.withScope`), Zedux makes sure the same values are still
   * provided. If the values have changed, a new atom instance is created with
   * the new scope.
   */
  public V:
    | Map<
        Record<string, any>,
        WeakRef<any> | number | string | boolean | null | undefined
      >
    | undefined = undefined

  /**
   * @see Job.W
   */
  public W = 1

  public P = 1

  /**
   * Detach this node from the ecosystem and clean up all graph edges and other
   * subscriptions/effects created by this node.
   *
   * Destruction will bail out if this node still has non-passive observers
   * (`node.o.size - (node.L ? 1 : 0)`). Pass `true` to force-destroy the node
   * anyway.
   *
   * When force-destroying a node that still has observers, the node will be
   * immediately recreated and all observers will be notified of the
   * destruction.
   */
  public abstract destroy(force?: boolean): void

  /**
   * Get the current value of this node.
   *
   * This is reactive! When called inside a reactive context (e.g. an atom state
   * factory or atom selector function), calling this method creates a graph
   * edge between the evaluating node and the node whose value this returns.
   *
   * Outside reactive contexts, this behaves exactly the same as `.getOnce()`
   *
   * To retrieve the node's value non-reactively, use `.getOnce()` instead.
   */
  public get(config?: GraphEdgeConfig) {
    // If get is called in a reactive context, track the required atom
    // instances so we can add graph edges for them. When called outside a
    // reactive context, get() is just an alias for ecosystem.get()
    getEvaluationContext().n &&
      bufferEdge(this, config?.op ?? 'get', config?.f ?? Eventless)

    return this.v
  }

  /**
   * Get the current value of this node without registering any graph
   * dependencies in reactive contexts.
   */
  public getOnce() {
    return this.v
  }

  /**
   * The unique id of this node in the graph. Zedux always tries to make this
   * somewhat human-readable for easier debugging.
   */
  public abstract id: string

  public on<E extends keyof ListenableEvents<G>>(
    eventName: E,
    callback: SingleEventListener<G, E>,
    listenerConfig?: ListenerConfig
  ): Cleanup

  public on(
    callback: CatchAllListener<G>,
    listenerConfig?: ListenerConfig
  ): Cleanup

  public on<E extends keyof ListenableEvents<G>>(
    eventNameOrCallback: E | ((eventMap: Partial<ListenableEvents<G>>) => void),
    callbackOrConfig?: SingleEventListener<G, E> | ListenerConfig,
    maybeConfig?: ListenerConfig
  ): Cleanup

  /**
   * Register a listener that will be called on this emitter's events.
   *
   * Event listeners are "passive" by default - they don't prevent the node
   * they're listening to from becoming Stale or Destroyed.
   *
   * Pass `{ active: true }` to change this, making the listener create its own
   * graph node that observes the current node. Like all normal observers, this
   * will prevent lifecycle changes.
   *
   * Internally, this adds a special "passive" observer to the node the first
   * time `.on` is called. Subsequent `.on` calls add listeners to that passive
   * observer's callback list and make it respond to more events. If a catch-all
   * listener is registered, the passive observer will react to all events.
   */
  public on<E extends keyof ListenableEvents<G>>(
    eventNameOrCallback: E | ((eventMap: Partial<ListenableEvents<G>>) => void),
    callbackOrConfig?: SingleEventListener<G, E> | ListenerConfig,
    maybeConfig?: ListenerConfig
  ): Cleanup {
    const [active, eventName, notify] = parseOnArgs(
      eventNameOrCallback,
      callbackOrConfig,
      maybeConfig
    )

    // active listeners create their own Listener node
    if (this.L && !active) {
      this.L.I(eventName, notify)

      return () => this.L?.D(eventName, notify)
    } else {
      const observer = new Listener<G>(this.e, this.e.makeId('listener', this))

      observer.u(this, 'on', ExplicitExternal)
      observer.I(eventName, notify)

      if (!active) this.L = observer

      return () => observer.D(eventName, notify)
    }
  }

  /**
   * A user-friendly wrapper for getting this node's `p`arams. Zedux uses the
   * obfuscated `p` property internally for efficiency, but end users should
   * prefer using `node.params`, invoking this getter.
   *
   * @see ZeduxNode.p
   */
  get params() {
    return this.p
  }

  get status() {
    return StatusMap[this.l]
  }

  /**
   * A user-friendly wrapper for getting this node's `t`emplate. Zedux uses the
   * obfuscated `t` property internally for efficiency, but end users should
   * prefer using `node.template`, invoking this getter.
   *
   * @see ZeduxNode.t
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
  public c: Cleanup | undefined = undefined

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
   * classes. Custom nodes (e.g. that extend `Signal`) may need to override it.
   *
   * NOTE: This is only designed to work with Zedux's default id structure
   * (where every node except atoms has an `@` prefix). When supplying a custom
   * `makeId` function, you should call `ecosystem.findAll()` (with no
   * arguments) and filter/dehydrate the list of nodes yourself.
   */
  public f(options?: NodeFilter): boolean | undefined | void {
    const { id, t } = this
    const lowerCaseId = id.toLowerCase()
    const {
      exclude = [],
      excludeTags = [],
      include = [],
      includeTags = [],
    } = typeof options === 'object' && !is(options, AtomTemplateBase)
      ? (options as NodeFilterOptions)
      : { include: options ? [options as string | AnyAtomTemplate] : [] }

    const isExcluded =
      exclude.some(templateOrKey =>
        typeof templateOrKey === 'string'
          ? templateOrKey === '@atom'
            ? !lowerCaseId.startsWith('@')
            : lowerCaseId.includes(templateOrKey.toLowerCase())
          : (t?.key && (templateOrKey as AtomTemplateBase)?.key === t?.key) ||
            templateOrKey === t
      ) || excludeTags.some(tag => t.tags?.includes(tag))

    return (
      !isExcluded &&
      ((!include.length && !includeTags.length) ||
        include.some(templateOrKey =>
          typeof templateOrKey === 'string'
            ? templateOrKey === '@atom'
              ? !lowerCaseId.startsWith('@')
              : lowerCaseId.includes(templateOrKey.toLowerCase())
            : (t?.key && (templateOrKey as AtomTemplateBase)?.key === t?.key) ||
              templateOrKey === t
        ) ||
        includeTags.some(tag => t.tags?.includes(tag)))
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
  public l: InternalLifecycleStatus = INITIALIZING

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
  public abstract o: Map<ZeduxNode, GraphEdge>

  /**
   * `p`arams - a reference to the exact params passed to this node. These never
   * change except:
   *
   * TODO: when a node is passed as a param to another node. In that case, the
   * ref will be swapped out if it's destroyed.
   */
  public abstract p: G['Params']

  /**
   * `r`un - schedule an evaluation of the graph node. If its value "changes",
   * this in turn schedules this node's observers, recursing down the graph
   * tree.
   */
  public r(reason: InternalEvaluationReason) {
    // don't schedule if destroyed and ignore `EventSent` reasons TODO: Any
    // calls when destroyed probably indicate a memory leak on the user's part.
    // Notify them. TODO: Can we pause evaluations while status is Stale (and
    // should we just always evaluate once when waking up a stale node)?
    if (
      this.l !== DESTROYED &&
      reason.t !== EventSent &&
      addReason(this, reason)
    ) {
      scheduleSync(this.e, this)
    }
  }

  /**
   * `s`ources - a map of the edges drawn between this node and all the nodes it
   * depends on, keyed by the ZeduxNode object reference of the source. Every
   * edge stored here is reverse-mapped - the exact same object reference will
   * also be stored in another node's `o`bservers.
   */
  public abstract s: Map<ZeduxNode, GraphEdge>

  /**
   * `t`emplate - a reference to the template that was used to create this node
   * - e.g. an `AtomTemplate` instance for atom instances or an
   * AtomSelectorOrConfig function or object for selector instances.
   */
  public abstract t: G['Template']

  /**
   * `v`alue - the current state of this signal.
   */
  // @ts-expect-error only some node types have state. They will need to make
  // sure they set this. This should be undefined for nodes that don't.
  public v: G['State']

  /**
   * `w`hy - the list of reasons explaining why this graph node updated or is
   * going to update. This is a singly-linked list.
   */
  public w: InternalEvaluationReason | undefined = undefined

  /**
   * `w`hy `t`ail - the last reason in the `w`hy linked list.
   */
  public wt: InternalEvaluationReason | undefined = undefined
}

export class ExternalNode<
  G extends NodeGenerics = AnyNodeGenerics
> extends ZeduxNode<G> {
  /**
   * @see ZeduxNode.T
   */
  public T = 3 as 2 // temporary until we sort out new graph algo

  /**
   * `i`nstance - the single source node this external node is observing
   */
  public i?: ZeduxNode

  /**
   * @see ZeduxNode.o External nodes don't typically have observers. So this
   * starts off as a getter for efficiency.
   */
  public get o(): Map<ZeduxNode, GraphEdge> {
    Object.defineProperty(this, 'o', { value: new Map() })
    return this.o
  }

  /**
   * @see ZeduxNode.p external nodes don't have params
   */
  public p: undefined

  /**
   * @see ZeduxNode.s
   */
  public s = new Map<ZeduxNode, GraphEdge>()

  /**
   * @see ZeduxNode.t external nodes don't have templates
   */
  public t: undefined

  constructor(
    /**
     * @see ZeduxNode.e
     */
    public readonly e: Ecosystem,

    /**
     * @see ZeduxNode.id
     */
    public readonly id: string,

    /**
     * `n`otify - tell the creator of this external node there's an update.
     */
    public readonly n: ((reason: InternalEvaluationReason) => void) & {
      m?: boolean
    }
  ) {
    super()
    e.n.set(id, this)
    setNodeStatus(this, ACTIVE)
  }

  /**
   * @see ZeduxNode.destroy
   */
  public destroy(skipUpdate?: boolean) {
    if (!this.i) return
    if (this.w) this.e.syncScheduler.unschedule(this)

    // external nodes only have one source, no observers
    removeEdge(this, this.i!)

    this.i = undefined
    this.e.n.delete(this.id)
    setNodeStatus(this, DESTROYED)

    // notify the external observer of the destruction if needed (does nothing
    // if the external observer initiated the destruction)
    skipUpdate || this.j()
  }

  /**
   * @see ZeduxNode.get external nodes have no own value. Their "value" is the
   * value of the single node they depend on. Access that directly instead.
   */
  public get() {}

  /**
   * @see ZeduxNode.d can't dehydrate external nodes
   */
  public d() {}

  /**
   * @see ZeduxNode.f `ecosystem.findAll()` never returns external nodes
   */
  public f() {}

  /**
   * @see ZeduxNode.j can't hydrate external nodes
   */
  public h() {}

  /**
   * @see ZeduxNode.j
   */
  public j() {
    if (this.n.m) {
      const isSingleReason = this.w === this.wt
      let reason: InternalEvaluationReason | undefined = this.w!

      do {
        this.n(isSingleReason ? reason : reason.r!)
      } while ((reason = reason!.l))
    }
    this.w = this.wt = undefined
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
  public k(source: ZeduxNode) {
    removeEdge(this, source)
    source === this.i && this.destroy(true)
  }

  /**
   * @see ZeduxNode.m
   */
  public m() {
    this.destroy()
  }

  /**
   * `u`pdateEdge - ExternalNodes maintain a single edge on a source node. But
   * the source can change. Call this to update it if needed.
   */
  public u(source: ZeduxNode, operation: string, flags: number) {
    this.i && removeEdge(this, this.i)

    this.i = source

    addEdge(this, source, {
      flags,
      operation: operation,
    })
  }
}

const noop = () => {}

export class Listener<
  G extends NodeGenerics = AnyNodeGenerics
> extends ExternalNode<G> {
  /**
   * event`C`ounts - counts notifiers for each event type (except catch-all)
   */
  public C: Record<string, number> = {}

  /**
   * `N`otifiers - passed notify functions
   */
  public N: ((reason: InternalEvaluationReason) => void)[] = []

  constructor(
    /**
     * @see ExternalNode.e
     */
    e: Ecosystem,

    /**
     * @see ExternalNode.id
     */
    id: string
  ) {
    super(e, id, noop)
  }

  /**
   * `D`ecrementNotifiers - remove a notifier function from this listener's list
   */
  public D(
    eventName: string,
    notify: (reason: InternalEvaluationReason) => void
  ) {
    const { C, N } = this
    const index = N?.indexOf(notify)

    if (~index) {
      N.splice(index, 1)
      C[eventName]--

      N.length || this.m()
    }
  }

  public I(
    eventName: string,
    notify: (reason: InternalEvaluationReason) => void
  ) {
    this.N.push(notify)
    this.C[eventName] = (this.C[eventName] ?? 0) + 1
  }

  /**
   * @see ExternalNode.j
   */
  public j() {
    if (this.N.length) {
      for (const notify of this.N) {
        const isSingleReason = this.w === this.wt
        let reason: InternalEvaluationReason | undefined = this.w!

        do {
          notify(isSingleReason ? reason : reason.r!)
        } while ((reason = reason!.l))
      }
    }
    this.w = this.wt = undefined

    // listeners auto-detach and destroy themselves when the node they listen to
    // is destroyed (after telling `this.N`otifiers about it)
    if (this.i?.l === DESTROYED) {
      this.k(this.i)
    }
  }

  /**
   * @see ExternalNode.r
   */
  public r(reason: InternalEvaluationReason) {
    const { e } = this
    const shouldSchedule = shouldScheduleImplicit(this, reason)

    // schedule the job if needed. If not scheduling, kill this listener now if
    // its source is destroyed.
    shouldSchedule && this.l !== DESTROYED
      ? addReason(this, reason) && scheduleSync(e, this)
      : this.i?.l === DESTROYED && this.k(this.i)
  }
}
