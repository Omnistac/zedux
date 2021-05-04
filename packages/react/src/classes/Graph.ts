import { AtomInstanceBase } from '../types'
import {
  DependentEdge,
  EcosystemGraphNode,
  EvaluationReason,
  EvaluationTargetType,
  EvaluationType,
  generateNodeId,
  JobType,
} from '../utils'
import { Ecosystem } from './Ecosystem'

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
  public addDependency(
    dependentKey: string,
    dependencyKey: string,
    isAsync = false
  ) {
    const dependency = this.nodes[dependencyKey]

    this.nodes[dependentKey].dependencies[dependencyKey] = true
    dependency.dependents[dependentKey] = { isAsync }

    this.unscheduleDestruction(dependencyKey)
    this.recalculateWeight(dependentKey, dependency.weight)
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

  // Should only be used internally
  // static dependencies don't change a node's weight
  public addStaticDependency(
    dependentKey: string,
    dependencyKey: string,
    isAsync = false
  ) {
    this.nodes[dependentKey].dependencies[dependencyKey] = true
    this.nodes[dependencyKey].dependents[dependentKey] = {
      isAsync,
      isStatic: true,
    }

    this.unscheduleDestruction(dependencyKey)
  }

  // external dependencies don't change a node's weight
  public registerExternalDynamicDependency<State>(
    dependency: AtomInstanceBase<State, any>,
    callback: (newState: State) => any,
    isAsync = false
  ) {
    const node = this.nodes[dependency.internals.keyHash]
    const id = generateNodeId()
    node.dependents[id] = { callback, isAsync, isExternal: true }

    return () => {
      delete node.dependents[id]
    }
  }

  // external or static dependencies don't change a node's weight
  public registerExternalStaticDependency(
    dependency: AtomInstanceBase<any, any>,
    isAsync = false
  ) {
    const node = this.nodes[dependency.internals.keyHash]
    const id = generateNodeId()
    node.dependents[id] = { isAsync, isExternal: true, isStatic: true }

    return () => {
      delete node.dependents[id]
    }
  }

  // Should only be used internally
  public removeDependency(dependentKey: string, dependencyKey: string) {
    const dependency = this.nodes[dependencyKey]

    delete this.nodes[dependentKey].dependencies[dependencyKey]
    delete dependency.dependents[dependentKey]

    if (!Object.keys(dependency.dependents).length) {
      this.ecosystem.instances[dependencyKey].internals.scheduleDestruction()
    }

    this.recalculateWeight(dependentKey, -dependency.weight)
  }

  // Should only be used internally
  public removeStaticDependency(dependentKey: string, dependencyKey: string) {
    const dependency = this.nodes[dependencyKey]

    delete this.nodes[dependentKey].dependencies[dependencyKey]
    delete dependency.dependents[dependentKey]

    if (!Object.keys(dependency.dependents).length) {
      this.ecosystem.instances[dependencyKey].internals.scheduleDestruction()
    }
  }

  // Should only be used internally
  public removeNode(nodeKey: string) {
    const node = this.nodes[nodeKey]

    if (!node) return // already removed

    // Remove this dependent from all its dependencies
    Object.keys(node.dependencies).forEach(dependency => {
      delete this.nodes[dependency].dependents[nodeKey]
    })

    // Remove this dependency from all its dependents and recalculate all weights recursively
    Object.keys(node.dependents).forEach(dependentKey => {
      this.recalculateWeight(dependentKey, -node.weight)

      delete this.nodes[dependentKey].dependencies[nodeKey]
    })

    delete this.nodes[nodeKey]
  }

  // an atom just updated. Schedule an update for all dynamic dependents
  // Should only be used internally
  public scheduleDependents(nodeKey: string, reasons: EvaluationReason[]) {
    const instance = this.ecosystem.instances[nodeKey]
    const node = this.nodes[nodeKey]

    Object.entries(node.dependents).forEach(([dependentKey, dependentEdge]) => {
      if (dependentEdge.isStatic) return

      const flagScore = getFlagScore(dependentEdge)

      if (!dependentEdge.isExternal) {
        return this.ecosystem.instances[
          dependentKey
        ].internals.scheduleEvaluation(
          {
            newState: instance.internals.stateStore.getState(),
            operation: 'injected atom',
            reasons,
            targetType: EvaluationTargetType.Atom,
            type: EvaluationType.StateChanged,
          },
          flagScore
        )
      }

      this.ecosystem.scheduler.scheduleJob({
        flagScore,
        task: () =>
          dependentEdge.callback?.(instance.internals.stateStore.getState()),
        type: JobType.UpdateExternalDependent,
      })
    })
  }

  private recalculateWeight(nodeKey: string, weightDiff: number) {
    const node = this.nodes[nodeKey]

    if (!node) return // .. shouldn't ever happen. Maybe remove this

    node.weight += weightDiff

    Object.keys(node.dependents).forEach(dependentKey => {
      this.recalculateWeight(dependentKey, weightDiff)
    })
  }

  private unscheduleDestruction(nodeKey: string) {
    const dependency = this.nodes[nodeKey]

    if (Object.keys(dependency.dependents).length === 1) {
      const instance = this.ecosystem.instances[nodeKey]

      // unschedule destruction of this atom
      if (instance.internals.destructionTimeout) {
        clearTimeout(instance.internals.destructionTimeout)
      }
    }
  }
}
