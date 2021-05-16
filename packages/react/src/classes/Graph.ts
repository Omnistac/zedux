import {
  DependentEdge,
  EcosystemGraphNode,
  EvaluationReason,
  EvaluationTargetType,
  EvaluationType,
  generateNodeId,
  GraphEdgeSignal,
  JobType,
} from '../utils'
import { Ecosystem } from './Ecosystem'
import { AtomInstance } from './instances/AtomInstance'
import { AtomInstanceBase } from './instances/AtomInstanceBase'

const getFlagScore = (dependentEdge: DependentEdge) => {
  let score = 0

  if (dependentEdge.isStatic) score += 4
  if (dependentEdge.isExternal) score += 2
  if (dependentEdge.isAsync) score += 1

  return score
}

export class Graph {
  public nodes: Record<string, EcosystemGraphNode> = {}

  public constructor(private readonly ecosystem: Ecosystem) {}

  // Should only be used internally
  public addDependency<State>(
    dependentKey: string,
    dependencyKey: string,
    operation: string,
    isStatic: boolean,
    isAsync = false,
    shouldUpdate?: (state: State) => boolean
  ) {
    const dependency = this.nodes[dependencyKey]

    this.nodes[dependentKey].dependencies[dependencyKey] = true
    dependency.dependents[dependentKey] = { isAsync, operation, shouldUpdate }

    this.unscheduleDestruction(dependencyKey)

    // static dependencies don't change a node's weight
    if (!isStatic) this.recalculateWeight(dependentKey, dependency.weight)
  }

  // Should only be used internally
  public addNode(nodeKey: string) {
    if (this.nodes[nodeKey]) return // already added

    this.nodes[nodeKey] = {
      dependencies: {},
      dependents: {},
      weight: 1, // this node doesn't have dependencies yet; it's weight is 1
    }
  }

  public registerExternalDependent<State>(
    dependency: AtomInstanceBase<State, any[], any>,
    callback: (signal: GraphEdgeSignal, newState: State) => any,
    operation: string,
    isStatic: boolean,
    isAsync = false
  ) {
    const nodeKey = dependency.keyHash
    const node = this.nodes[nodeKey]
    const id = generateNodeId()

    node.dependents[id] = {
      callback,
      isAsync,
      isExternal: true,
      isStatic,
      operation,
    }

    this.unscheduleDestruction(nodeKey)

    return () => {
      const dependent = node.dependents[id]
      if (dependent.task) {
        this.ecosystem.scheduler.unscheduleJob(dependent.task)
      }

      delete node.dependents[id]
      this.scheduleInstanceDestruction(dependency.keyHash)
    }
  }

  // Should only be used internally
  public removeDependency(dependentKey: string, dependencyKey: string) {
    delete this.nodes[dependentKey].dependencies[dependencyKey]

    const dependency = this.nodes[dependencyKey]
    if (!dependency) return // dependency has already been cleaned up; nothing more to do

    const dependentEdge = dependency.dependents[dependentKey]
    delete dependency.dependents[dependentKey]

    // static dependencies don't change a node's weight
    if (!dependentEdge.isStatic) {
      this.recalculateWeight(dependentKey, -dependency.weight)
    }

    this.scheduleInstanceDestruction(dependencyKey)
  }

  // Should only be used internally
  public removeNode(nodeKey: string) {
    const node = this.nodes[nodeKey]

    if (!node) return // already removed

    // We don't need to remove this dependent from its dependencies here - each
    // dependency will have handled itself when its injector was cleaned up,
    // which happens before this function is called as part of the instance
    // destruction process

    // Remove this dependency from all its dependents and recalculate all weights recursively
    Object.keys(node.dependents).forEach(dependentKey => {
      const dependentEdge = node.dependents[dependentKey]
      const flagScore = getFlagScore(dependentEdge)

      if (dependentEdge.isExternal) {
        this.ecosystem.scheduler.scheduleJob({
          flagScore,
          task: () => dependentEdge.callback?.(GraphEdgeSignal.Destroyed),
          type: JobType.UpdateExternalDependent,
        })

        return
      }

      if (!dependentEdge.isStatic) {
        this.recalculateWeight(dependentKey, -node.weight)
      }

      delete this.nodes[dependentKey].dependencies[nodeKey]

      this.ecosystem.instances[dependentKey]._scheduleEvaluation(
        {
          operation: dependentEdge.operation,
          targetKey: nodeKey,
          targetType: EvaluationTargetType.Atom,
          type: EvaluationType.InstanceDestroyed,
        },
        flagScore
      )
    })

    delete this.nodes[nodeKey]
  }

  // an atom just updated. Schedule an update for all dynamic dependents
  // Should only be used internally
  public scheduleDependents(nodeKey: string, reasons: EvaluationReason[]) {
    const instance = this.ecosystem.instances[nodeKey]
    const node = this.nodes[nodeKey]

    Object.entries(node.dependents).forEach(([dependentKey, dependentEdge]) => {
      // static deps don't update and if edge.cleanup exists, this edge has
      // already been scheduled
      if (dependentEdge.isStatic || dependentEdge.task) return

      const flagScore = getFlagScore(dependentEdge)
      const newState = instance._stateStore.getState()

      // let internal dependents (other atoms) schedule themselves
      if (!dependentEdge.isExternal) {
        if (
          dependentEdge.shouldUpdate &&
          !dependentEdge.shouldUpdate(newState)
        ) {
          return
        }

        return this.ecosystem.instances[dependentKey]._scheduleEvaluation(
          {
            newState,
            operation: dependentEdge.operation,
            reasons,
            targetKey: nodeKey,
            targetType: EvaluationTargetType.Atom,
            type: EvaluationType.StateChanged,
          },
          flagScore
        )
      }

      const task = () => {
        dependentEdge.task = undefined
        dependentEdge.callback?.(GraphEdgeSignal.Updated, newState)
      }

      this.ecosystem.scheduler.scheduleJob({
        flagScore,
        task,
        type: JobType.UpdateExternalDependent,
      })

      dependentEdge.task = () => this.ecosystem.scheduler.unscheduleJob(task)
    })
  }

  public wipe() {
    // TODO: Delete nodes in an optimal order (starting with leaf nodes - nodes
    // with no internal dependents). Use `instance.destroy()` on those and let
    // that clean up this object. Don't wipe it manually like this:
    this.nodes = {}
  }

  private recalculateWeight(nodeKey: string, weightDiff: number) {
    const node = this.nodes[nodeKey]

    if (!node) return // .. shouldn't ever happen. Maybe remove this

    node.weight += weightDiff

    Object.keys(node.dependents).forEach(dependentKey => {
      this.recalculateWeight(dependentKey, weightDiff)
    })
  }

  private scheduleInstanceDestruction(nodeKey: string) {
    const node = this.nodes[nodeKey]

    if (node && !Object.keys(node.dependents).length) {
      this.ecosystem.instances[nodeKey]._scheduleDestruction()
    }
  }

  private unscheduleDestruction(nodeKey: string) {
    const dependency = this.nodes[nodeKey]

    if (Object.keys(dependency.dependents).length === 1) {
      const instance = this.ecosystem.instances[nodeKey] as AtomInstance<
        any,
        any[],
        any
      >

      // unschedule destruction of this atom
      if (instance._destructionTimeout) {
        clearTimeout(instance._destructionTimeout)
      }
    }
  }
}
