import {
  DependentEdge,
  EdgeFlag,
  EvaluationReason,
  EvaluationTargetType,
  EvaluationType,
  GraphEdgeSignal,
} from '../types'
import {
  EcosystemGraphNode,
  JobType,
  UpdateExternalDependentJob,
} from '../utils'
import { Ecosystem } from './Ecosystem'
import { AtomInstance } from './instances/AtomInstance'
import { ZeduxPlugin } from './ZeduxPlugin'

export class Graph {
  public nodes: Record<string, EcosystemGraphNode> = {}
  private updateStack: {
    dependencies: Record<string, DependentEdge>
    key: string
  }[] = []

  public constructor(private readonly ecosystem: Ecosystem) {}

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
    callback?: DependentEdge['callback']
  ) {
    const newEdge: DependentEdge = {
      callback,
      createdAt: Date.now(),
      flags,
      operation,
    }

    if (!this.updateStack.length) {
      return this.finishAddingEdge(dependentKey, dependencyKey, newEdge)
    }

    // We're buffering updates! Buffer this one
    const { dependencies, key } = this.updateStack[this.updateStack.length - 1]

    if (key !== dependentKey) {
      throw new Error(
        "Zedux - Tried updating dependencies of a graph node that isn't currently evaluating. This means that either you tried updating the graph manually or there is a bug in Zedux. If it's a bug, please report it!"
      )
    }

    const dependency = dependencies[dependencyKey]

    // Don't overwrite a higher-prio edge with a lower one. Also ignore same-prio
    if (!dependency || dependency.flags > flags) {
      dependencies[dependencyKey] = newEdge
      return newEdge
    }

    // if this edge was ignored, return the existing buffered edge
    return dependencies[dependencyKey]
  }

  // Should only be used internally
  public addNode(nodeKey: string, isAtomSelector?: boolean) {
    if (this.nodes[nodeKey]) return // already added

    this.nodes[nodeKey] = {
      dependencies: {},
      dependents: {},
      isAtomSelector,
      weight: 1, // this node doesn't have dependencies yet; it's weight is 1
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
    this.updateStack.push({ key, dependencies: {} })
  }

  /**
   * If an atom instance or AtomSelector errors during evaluation, we need to
   * destroy any instances or AtomSelectors created during that evaluation that
   * no longer have dependents
   */
  public destroyBuffer() {
    const { dependencies, key } = this.updateStack[this.updateStack.length - 1]
    const edges = this.nodes[key].dependencies

    Object.keys(dependencies).forEach(dependencyKey => {
      const existingEdge = edges[dependencyKey]

      // the edge wasn't created during the evaluation that errored; keep it
      if (existingEdge) return

      this.scheduleInstanceDestruction(dependencyKey)
    })
  }

  /**
   * Stop buffering updates for the node passed to `.bufferUpdates()` and add
   * the buffered edges to the graph.
   */
  public flushUpdates() {
    const { dependencies, key } = this.updateStack[this.updateStack.length - 1]
    const edges = this.nodes[key].dependencies

    // remove any edges that were not recreated while buffering
    Object.keys(edges).forEach(dependencyKey => {
      const existingEdge = this.nodes[dependencyKey].dependents[key]

      const edgeToAdd = dependencies[dependencyKey]

      if (edgeToAdd && edgeToAdd.flags === existingEdge.flags) return

      this.removeEdge(key, dependencyKey)
    })

    // add new edges that we tracked while buffering
    Object.keys(dependencies).forEach(dependencyKey => {
      const edgeToAdd = dependencies[dependencyKey]
      const existingEdge = edges[dependencyKey]

      if (existingEdge) return

      this.finishAddingEdge(key, dependencyKey, edgeToAdd)
    })

    this.updateStack.pop()
  }

  public getRefCount(dependencyKey: string) {
    return Object.keys(this.nodes[dependencyKey]?.dependents || {}).length
  }

  public removeDependencies(dependentKey: string) {
    const edges = this.nodes[dependentKey].dependencies

    if (!edges) return

    Object.keys(edges).forEach(dependencyKey => {
      this.removeEdge(dependentKey, dependencyKey)
    })
  }

  /**
   * Should only be used internally. Remove the graph edge between two nodes.
   * The dependent may not exist as a node in the graph if it's external, e.g. a
   * React component
   */
  public removeEdge(dependentKey: string, dependencyKey: string) {
    const dependency = this.nodes[dependencyKey]
    const dependent = this.nodes[dependentKey] // won't exist if external

    // erase graph edge between dependent and dependency
    if (dependent) {
      delete dependent.dependencies[dependencyKey]
    }

    // TODO: This check should be completely unnecessary. Why would the
    // dependent still have an edge to this dependency if this dependency has
    // been cleaned up? Kill this check with amazing tests.
    if (!dependency) return

    const dependentEdge = dependency.dependents[dependentKey]
    delete dependency.dependents[dependentKey]

    // static dependencies don't change a node's weight
    if (!(dependentEdge.flags & EdgeFlag.Static)) {
      this.recalculateWeight(dependentKey, -dependency.weight)
    }

    if (dependentEdge.task) {
      this.ecosystem._scheduler.unscheduleJob(dependentEdge.task)
    }

    if (this.ecosystem.mods.edgeRemoved) {
      this.ecosystem.modsMessageBus.dispatch(
        ZeduxPlugin.actions.edgeRemoved({
          dependency:
            this.ecosystem._instances[dependencyKey] ||
            this.ecosystem._selectorCache.caches[dependencyKey],
          dependent:
            this.ecosystem._instances[dependentKey] ||
            this.ecosystem._selectorCache.caches[dependentKey] ||
            dependentKey,
          edge: dependentEdge,
        })
      )
    }

    this.scheduleInstanceDestruction(dependencyKey)
  }

  // Should only be used internally
  public removeNode(nodeKey: string) {
    const node = this.nodes[nodeKey]

    if (!node) return // already removed

    // We don't need to remove this dependent from its dependencies here - the
    // atom instance will have removed all its deps before calling this function
    // as part of the instance destruction process

    // Remove this dependency from all its dependents and recalculate all
    // weights recursively
    Object.keys(node.dependents).forEach(dependentKey => {
      const dependentEdge = node.dependents[dependentKey]

      if (dependentEdge.flags & EdgeFlag.External) {
        const job: UpdateExternalDependentJob = {
          flags: dependentEdge.flags,
          task: () => dependentEdge.callback?.(GraphEdgeSignal.Destroyed),
          type: JobType.UpdateExternalDependent,
        }

        this.ecosystem._scheduler.scheduleJob(job)
        return
      }

      if (!(dependentEdge.flags & EdgeFlag.Static)) {
        this.recalculateWeight(dependentKey, -node.weight)
      }

      const dependentNode = this.nodes[dependentKey]
      delete dependentNode.dependencies[nodeKey]
      const reasons = {
        operation: dependentEdge.operation,
        targetKey: nodeKey,
        targetType: node.isAtomSelector
          ? EvaluationTargetType.AtomSelector
          : EvaluationTargetType.Atom,
        type: EvaluationType.InstanceDestroyed,
      }

      if (dependentNode.isAtomSelector) {
        this.ecosystem._selectorCache._scheduleEvaluation(
          dependentKey,
          reasons,
          dependentEdge.flags
        )
      } else {
        this.ecosystem._instances[dependentKey]._scheduleEvaluation(
          reasons,
          dependentEdge.flags
        )
      }
    })

    delete this.nodes[nodeKey]
  }

  // an atom instance or AtomSelector just updated. Schedule an update for all
  // dynamic dependents. Should only be used internally
  public scheduleDependents(
    nodeKey: string,
    reasons: EvaluationReason[],
    newState: any,
    oldState: any
  ) {
    const instance = this.ecosystem._instances[nodeKey]
    const cache = this.ecosystem._selectorCache.caches[nodeKey]
    const node = this.nodes[nodeKey]

    Object.keys(node.dependents).forEach(dependentKey => {
      const dependentEdge = node.dependents[dependentKey]

      // static deps don't update and if edge.task exists, this edge has
      // already been scheduled
      if (dependentEdge.flags & EdgeFlag.Static || dependentEdge.task) return

      // let internal dependents (other atoms and AtomSelectors) schedule their
      // own jobs
      if (!(dependentEdge.flags & EdgeFlag.External)) {
        const reason = {
          newState,
          oldState,
          operation: dependentEdge.operation,
          reasons,
          targetKey: nodeKey,
          targetType: EvaluationTargetType.Atom,
          type: EvaluationType.StateChanged,
        }

        if (this.nodes[dependentKey].isAtomSelector) {
          return this.ecosystem._selectorCache._scheduleEvaluation(
            dependentKey,
            reason,
            dependentEdge.flags
          )
        } else {
          return this.ecosystem._instances[dependentKey]._scheduleEvaluation(
            reason,
            dependentEdge.flags
          )
        }
      }

      // schedule external dependents
      const task = () => {
        dependentEdge.task = undefined
        dependentEdge.callback?.(
          GraphEdgeSignal.Updated,
          instance ? instance.store.getState() : cache.result, // don't use the snapshotted newState above
          reasons
        )
      }

      this.ecosystem._scheduler.scheduleJob({
        flags: dependentEdge.flags,
        task,
        type: JobType.UpdateExternalDependent,
      })

      // mutate the edge; give it the scheduled task so it can be cleaned up
      dependentEdge.task = task
    })
  }

  private finishAddingEdge(
    dependentKey: string,
    dependencyKey: string,
    newEdge: DependentEdge
  ) {
    const dependency = this.nodes[dependencyKey]

    // draw graph edge between dependent and dependency
    if (!(newEdge.flags & EdgeFlag.External)) {
      this.nodes[dependentKey].dependencies[dependencyKey] = true
    }
    dependency.dependents[dependentKey] = newEdge

    this.unscheduleDestruction(dependencyKey)

    // static dependencies don't change a node's weight
    if (!(newEdge.flags & EdgeFlag.Static)) {
      this.recalculateWeight(dependentKey, dependency.weight)
    }

    if (this.ecosystem.mods.edgeCreated) {
      this.ecosystem.modsMessageBus.dispatch(
        ZeduxPlugin.actions.edgeCreated({
          dependency:
            this.ecosystem._instances[dependencyKey] ||
            this.ecosystem._selectorCache.caches[dependencyKey],
          dependent:
            this.ecosystem._instances[dependentKey] ||
            this.ecosystem._selectorCache.caches[dependentKey] ||
            dependentKey, // unfortunate but not changing for now
          edge: newEdge,
        })
      )
    }

    return newEdge
  }

  private recalculateWeight(nodeKey: string, weightDiff: number) {
    const node = this.nodes[nodeKey]

    if (!node) return // happens when node is external

    node.weight += weightDiff

    Object.keys(node.dependents).forEach(dependentKey => {
      this.recalculateWeight(dependentKey, weightDiff)
    })
  }

  private scheduleInstanceDestruction(nodeKey: string) {
    const node = this.nodes[nodeKey]

    if (node && !Object.keys(node.dependents).length) {
      if (node.isAtomSelector) {
        this.ecosystem._selectorCache._destroySelector(nodeKey)
      } else {
        this.ecosystem._instances[nodeKey]._scheduleDestruction()
      }
    }
  }

  /**
   * When an atom instance's refCount hits 0, we try to schedule destruction of
   * that atom instance. If that destruction is still pending and the refCount
   * goes back up to 1, cancel the scheduled destruction.
   */
  private unscheduleDestruction(nodeKey: string) {
    const dependency = this.nodes[nodeKey]

    if (
      !dependency.isAtomSelector &&
      Object.keys(dependency.dependents).length === 1
    ) {
      const instance = this.ecosystem._instances[nodeKey] as AtomInstance<
        any,
        any[],
        any
      >

      instance._cancelDestruction?.()
    }
  }
}
