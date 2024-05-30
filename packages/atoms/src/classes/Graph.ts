import {
  DependentCallback,
  DependentEdge,
  EcosystemGraphNode,
  EvaluationReason,
  EvaluationType,
  GraphEdgeSignal,
} from '../types/index'
import { Explicit, External, Static } from '../utils/index'
import { pluginActions } from '../utils/plugin-actions'
import { Ecosystem } from './Ecosystem'

/**
 * When a node's refCount hits 0, schedule destruction of that node.
 */
const scheduleNodeDestruction = (
  { ecosystem, nodes }: Graph,
  nodeId: string
) => {
  const node = nodes[nodeId]

  if (node && !node.refCount) {
    if (node.isSelector) {
      ecosystem.selectors._destroySelector(nodeId)
    } else {
      ecosystem._instances[nodeId]._scheduleDestruction()
    }
  }
}

/**
 * When a node's refCount hits 0, we schedule destruction of that node. If
 * that destruction is still pending and the refCount goes back up to 1,
 * cancel the scheduled destruction.
 */
const unscheduleNodeDestruction = (
  { ecosystem, nodes }: Graph,
  nodeId: string
) => {
  const dependency = nodes[nodeId]

  if (!dependency.isSelector) {
    ecosystem._instances[nodeId]._cancelDestruction?.()
  }
}

export class Graph {
  public nodes: Record<string, EcosystemGraphNode> = {}
  private updateStack: {
    dependencies: Map<string, DependentEdge>
    key: string
  }[] = []

  public constructor(public readonly ecosystem: Ecosystem) {}

  /**
   * Draw a new edge between two nodes in the graph. This is how dependencies
   * are created between atoms, selectors, and external nodes like React
   * components.
   */
  public addEdge(
    dependentKey: string,
    dependencyKey: string,
    operation: string,
    flags: number,
    callback?: DependentCallback
  ) {
    const { ecosystem, updateStack } = this
    const newEdge: DependentEdge = {
      callback,
      createdAt: ecosystem._idGenerator.now(),
      flags,
      operation,
    }

    if (!updateStack.length) {
      return this.finishAddingEdge(dependentKey, dependencyKey, newEdge)
    }

    // We're buffering updates! Buffer this one
    const { dependencies, key } = updateStack[updateStack.length - 1]

    if (DEV && key !== dependentKey) {
      throw new Error(
        "Zedux: Tried updating dependencies of a graph node that isn't currently evaluating. This means that either you tried updating the graph manually or there is a bug in Zedux. If it's a bug, please report it!"
      )
    }

    const dependency = dependencies.get(dependencyKey)

    // Don't overwrite a higher-prio edge with a lower one. Also ignore same-prio
    if (!dependency || dependency.flags > flags) {
      dependencies.set(dependencyKey, newEdge)
      return newEdge
    }

    // if this edge was ignored, return the existing buffered edge
    return dependency
  }

  // Should only be used internally
  public addNode(nodeId: string, isSelector?: boolean) {
    if (this.nodes[nodeId]) return // already added

    this.nodes[nodeId] = {
      dependencies: new Map(),
      dependents: new Map(),
      isSelector,
      refCount: 0,
      weight: 1, // this node doesn't have dependencies yet; its weight is 1
    }
  }

  /**
   * Prevent new graph edges from being added immediately. Instead, buffer them
   * so we can prevent duplicates or unnecessary edges. Call `.flushUpdates()`
   * to finish buffering.
   *
   * This is used during atom and AtomSelector evaluation to make the graph as
   * efficient as possible.
   */
  public bufferUpdates(key: string) {
    this.updateStack.push({ key, dependencies: new Map() })
  }

  /**
   * If an atom instance or AtomSelector errors during evaluation, we need to
   * destroy any instances or AtomSelectors created during that evaluation that
   * now have no dependents.
   */
  public destroyBuffer() {
    const { dependencies, key } = this.updateStack[this.updateStack.length - 1]
    const edges = this.nodes[key].dependencies

    for (const dependencyKey of dependencies.keys()) {
      // the edge wasn't created during the evaluation that errored; keep it
      if (edges.get(dependencyKey)) continue

      scheduleNodeDestruction(this, dependencyKey)
    }

    this.updateStack.pop()
  }

  /**
   * Stop buffering updates for the node passed to `.bufferUpdates()` and add
   * the buffered edges to the graph.
   */
  public flushUpdates() {
    const { nodes, updateStack } = this
    const { dependencies, key } = updateStack[updateStack.length - 1]
    const edges = nodes[key].dependencies

    // remove any edges that were not recreated while buffering. Don't remove
    // anything but implicit-internal edges (those are the only kind we
    // auto-create during evaluation - other types may have been added manually
    // by the user and we don't want to touch them here)
    for (const dependencyKey of edges.keys()) {
      // this cast should be fine
      const existingEdge = nodes[dependencyKey].dependents.get(
        key
      ) as DependentEdge

      if (existingEdge.flags & (Explicit | External)) continue

      const edgeToAdd = dependencies.get(dependencyKey)

      // if edge still exists, keep it
      if (!edgeToAdd || edgeToAdd.flags !== existingEdge.flags) {
        this.removeEdge(key, dependencyKey)
      }
    }

    // add new edges that we tracked while buffering
    for (const [dependencyKey, edgeToAdd] of dependencies.entries()) {
      const existingEdge = edges.get(dependencyKey)

      // if edge already exists, keep it
      if (!existingEdge) {
        this.finishAddingEdge(key, dependencyKey, edgeToAdd)
      }
    }

    updateStack.pop()
  }

  public removeDependencies(dependentKey: string) {
    const node = this.nodes[dependentKey]

    if (!node) return // node already destroyed

    const edges = node.dependencies

    if (!edges) return // TODO: delete

    for (const dependencyKey of edges.keys()) {
      this.removeEdge(dependentKey, dependencyKey)
    }
  }

  /**
   * Should only be used internally. Remove the graph edge between two nodes.
   * The dependent may not exist as a node in the graph if it's external, e.g. a
   * React component
   *
   * For some reason in React 18+, React destroys parents before children. This
   * means a parent EcosystemProvider may have already unmounted and wiped the
   * whole graph; this edge may already be destroyed.
   */
  public removeEdge(dependentKey: string, dependencyKey: string) {
    const dependency = this.nodes[dependencyKey]
    const dependent = this.nodes[dependentKey] // won't exist if external

    // erase graph edge between dependent and dependency
    if (dependent) {
      dependent.dependencies.delete(dependencyKey)
    }

    // hmm could maybe happen when a dependency was force-destroyed if a child
    // tries to destroy its edge before recreating it (I don't think we ever do
    // that though)
    if (!dependency) return

    const dependentEdge = dependency.dependents.get(dependentKey)

    // happens in React 18+ (see this method's jsdoc above)
    if (!dependentEdge) {
      // useAtomSelector can delete edges that were never drawn 'cause React
      // StrictMode double-renders can create an entirely new SelectorCache
      // before the old one received dependents. Delete the old one in this case
      if (dependency.isSelector) scheduleNodeDestruction(this, dependencyKey)

      return
    }

    dependency.dependents.delete(dependentKey)
    dependency.refCount--

    // static dependencies don't change a node's weight
    if (!(dependentEdge.flags & Static)) {
      this.recalculateNodeWeight(dependentKey, -dependency.weight)
    }

    const { _instances, _mods, _scheduler, modBus, selectors } = this.ecosystem

    if (dependentEdge.task) {
      _scheduler.unschedule(dependentEdge.task)
    }

    if (_mods.edgeRemoved) {
      modBus.dispatch(
        pluginActions.edgeRemoved({
          dependency:
            _instances[dependencyKey] || selectors._items[dependencyKey],
          dependent:
            _instances[dependentKey] ||
            selectors._items[dependentKey] ||
            dependentKey,
          edge: dependentEdge,
        })
      )
    }

    scheduleNodeDestruction(this, dependencyKey)
  }

  // Should only be used internally
  public removeNode(nodeId: string) {
    const node = this.nodes[nodeId]

    if (!node) return // already removed

    // We don't need to remove this dependent from its dependencies here - the
    // atom instance/AtomSelector will have removed all its deps before calling
    // this function as part of its destruction process

    // if an atom instance is force-destroyed, it could still have dependents.
    // Inform them of the destruction
    this.scheduleDependents(
      nodeId,
      [],
      undefined,
      undefined,
      true,
      'node destroyed',
      'Destroyed',
      true
    )

    // Remove this dependency from all its dependents and recalculate all
    // weights recursively
    for (const [dependentKey, dependentEdge] of node.dependents.entries()) {
      if (!(dependentEdge.flags & Static)) {
        this.recalculateNodeWeight(dependentKey, -node.weight)
      }

      const dependentNode = this.nodes[dependentKey]

      if (dependentNode) dependentNode.dependencies.delete(nodeId)

      // we _probably_ don't need to send edgeRemoved mod events to plugins for
      // these - it's better that they receive the duplicate edgeCreated event
      // when the dependency is recreated by its dependent(s) so they can infer
      // that the edge was "moved"
    }

    delete this.nodes[nodeId]
  }

  /**
   * Schedules a job to update all dependents of a node. This is called e.g.
   * when an atom instance or AtomSelector updates, when an atom instance is
   * force-destroyed, or when an atom instance's promise changes.
   */
  public scheduleDependents(
    nodeId: string,
    reasons: EvaluationReason[],
    newState: any,
    oldState: any,
    shouldSetTimeout?: boolean,
    type: EvaluationType = 'state changed',
    signal: GraphEdgeSignal = 'Updated',
    scheduleStaticDeps = false
  ) {
    const { _instances, _scheduler, selectors } = this.ecosystem
    const instance = _instances[nodeId]
    const cache = selectors._items[nodeId]
    const node = this.nodes[nodeId]

    for (const [dependentKey, dependentEdge] of node.dependents.entries()) {
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
        reasons,
        sourceId: nodeId,
        sourceType: node.isSelector ? 'AtomSelector' : 'Atom',
        type,
      }

      // let internal dependents (other atoms and AtomSelectors) schedule their
      // own jobs
      if (!(dependentEdge.flags & External)) {
        if (this.nodes[dependentKey].isSelector) {
          selectors._scheduleEvaluation(dependentKey, reason, shouldSetTimeout)
          continue
        }

        _instances[dependentKey]._scheduleEvaluation(reason, shouldSetTimeout)
        continue
      }

      // schedule external dependents
      const task = () => {
        dependentEdge.task = undefined
        dependentEdge.callback?.(
          signal,
          instance ? instance.store.getState() : cache.result, // don't use the snapshotted newState above
          reason
        )
      }

      _scheduler.schedule(
        {
          flags: dependentEdge.flags,
          task,
          type: 3, // UpdateExternalDependent (3)
        },
        shouldSetTimeout
      )

      // mutate the edge; give it the scheduled task so it can be cleaned up
      dependentEdge.task = task
    }
  }

  /**
   * Actually add an edge to the graph. When we buffer graph updates, we're
   * really just deferring the calling of this method.
   */
  private finishAddingEdge(
    dependentKey: string,
    dependencyKey: string,
    newEdge: DependentEdge
  ) {
    const dependency = this.nodes[dependencyKey]

    if (!dependency) return // happened once for some reason

    // draw graph edge between dependent and dependency
    if (!(newEdge.flags & External)) {
      this.nodes[dependentKey].dependencies.set(dependencyKey, true)
    }
    dependency.dependents.set(dependentKey, newEdge)
    dependency.refCount++

    unscheduleNodeDestruction(this, dependencyKey)

    // static dependencies don't change a node's weight
    if (!(newEdge.flags & Static)) {
      this.recalculateNodeWeight(dependentKey, dependency.weight)
    }

    const { _instances, _mods, modBus, selectors } = this.ecosystem

    if (_mods.edgeCreated) {
      modBus.dispatch(
        pluginActions.edgeCreated({
          dependency:
            _instances[dependencyKey] || selectors._items[dependencyKey],
          dependent:
            _instances[dependentKey] ||
            selectors._items[dependentKey] ||
            dependentKey, // unfortunate but not changing for now UPDATE: shouldn't be needed anymore. Double check
          edge: newEdge,
        })
      )
    }

    return newEdge
  }

  /**
   * When a non-static edge is added or removed, every node below that edge (the
   * dependent, its dependents, etc) in the graph needs to have its weight
   * recalculated.
   */
  private recalculateNodeWeight(nodeId: string, weightDiff: number) {
    const node = this.nodes[nodeId]

    if (!node) return // happens when node is external

    node.weight += weightDiff

    for (const dependentKey of node.dependents.keys()) {
      this.recalculateNodeWeight(dependentKey, weightDiff)
    }
  }
}
