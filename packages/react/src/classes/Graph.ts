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
import { AtomInstance } from './AtomInstance'
import { AtomInstanceBase } from './instances/AtomInstanceBase'

/**
 * The flag score determines job priority in the scheduler. Scores range from
 * 0-7. Lower score = higher prio. Examples:
 *
 * 0 = synchronous-internal-dynamic
 * 3 = asynchronous-external-dynamic
 * 7 = asynchronous-external-static
 */
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
    shouldUpdate?: (state: State) => boolean // used for selectors
  ) {
    const dependency = this.nodes[dependencyKey]
    const newEdge: DependentEdge = {
      isAsync,
      isStatic,
      operation,
      shouldUpdate,
    }

    this.nodes[dependentKey].dependencies[dependencyKey] = true

    if (dependency.dependents[dependentKey]) {
      dependency.dependents[dependentKey].push(newEdge)
    } else {
      dependency.dependents[dependentKey] = [newEdge]
    }

    this.unscheduleDestruction(dependencyKey)

    // static dependencies don't change a node's weight
    if (!isStatic) this.recalculateWeight(dependentKey, dependency.weight)

    return newEdge
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
    callback: DependentEdge['callback'],
    operation: string,
    isStatic: boolean,
    isAsync = false
  ) {
    const nodeKey = dependency.keyHash
    const node = this.nodes[nodeKey]

    if (!node) {
      console.warn(
        'Zedux - tried registering external dependent after its dependency was destroyed. This may indicate a memory leak in your application'
      )
      return () => {}
    }

    // would be nice if React provided a way to know that multiple hooks were
    // part of the same component
    const id = generateNodeId()
    const newEdge: DependentEdge = {
      callback,
      isAsync,
      isExternal: true,
      isStatic,
      operation,
    }

    node.dependents[id] = [newEdge]

    this.unscheduleDestruction(nodeKey)

    return () => {
      if (newEdge.task) {
        this.ecosystem._scheduler.unscheduleJob(newEdge.task)
      }

      // this is fine; external dependents can't register multiple edges on the
      // same dependent id:
      delete node.dependents[id]
      this.scheduleInstanceDestruction(dependency.keyHash)
    }
  }

  // Should only be used internally
  public removeDependency(
    dependentKey: string,
    dependencyKey: string,
    dependentEdge: DependentEdge
  ) {
    const dependency = this.nodes[dependencyKey]
    const dependentEdges = dependency?.dependents[dependentKey]

    // if this edge has multiple dependent edges, unregister one of them
    if (dependentEdges?.length > 1) {
      const index = dependentEdges.indexOf(dependentEdge)

      // shouldn't happen:
      if (index !== -1) {
        dependentEdges.splice(index, 1)
      }

      return
    }

    delete this.nodes[dependentKey].dependencies[dependencyKey]

    if (!dependency) return // dependency has already been cleaned up; nothing more to do

    // since this was the last dependentEdge on this edge, delete the array
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
      const dependentEdges = node.dependents[dependentKey]
      dependentEdges.forEach(dependentEdge => {
        const flagScore = getFlagScore(dependentEdge)

        if (dependentEdge.isExternal) {
          this.ecosystem._scheduler.scheduleJob({
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

        this.ecosystem._instances[dependentKey]._scheduleEvaluation(
          {
            operation: dependentEdge.operation,
            targetKey: nodeKey,
            targetType: EvaluationTargetType.Atom,
            type: EvaluationType.InstanceDestroyed,
          },
          flagScore
        )
      })
    })

    delete this.nodes[nodeKey]
  }

  // an atom just updated. Schedule an update for all dynamic dependents
  // Should only be used internally
  public scheduleDependents(
    nodeKey: string,
    reasons: EvaluationReason[],
    newState: any,
    oldState: any
  ) {
    const instance = this.ecosystem._instances[nodeKey]
    const node = this.nodes[nodeKey]

    Object.entries(node.dependents).forEach(
      ([dependentKey, dependentEdges]) => {
        dependentEdges.forEach(dependentEdge => {
          // static deps don't update and if edge.task exists, this edge has
          // already been scheduled
          if (dependentEdge.isStatic || dependentEdge.task) return

          const flagScore = getFlagScore(dependentEdge)

          // let internal dependents (other atoms) schedule themselves
          if (!dependentEdge.isExternal) {
            if (
              dependentEdge.shouldUpdate &&
              !dependentEdge.shouldUpdate(newState)
            ) {
              return
            }

            return this.ecosystem._instances[dependentKey]._scheduleEvaluation(
              {
                newState,
                oldState,
                operation: dependentEdge.operation,
                reasons,
                targetKey: nodeKey,
                targetType: EvaluationTargetType.Atom,
                type: EvaluationType.StateChanged,
              },
              flagScore
            )
          }

          // schedule external dependents
          const task = () => {
            dependentEdge.task = undefined
            dependentEdge.callback?.(
              GraphEdgeSignal.Updated,
              instance.store.getState(), // don't use the snapshotted newState above
              reasons
            )
          }

          this.ecosystem._scheduler.scheduleJob({
            flagScore,
            task,
            type: JobType.UpdateExternalDependent,
          })

          // mutate the edge; give it the scheduled task so it can be cleaned up
          dependentEdge.task = task
        })
      }
    )
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
      this.ecosystem._instances[nodeKey]._scheduleDestruction()
    }
  }

  private unscheduleDestruction(nodeKey: string) {
    const dependency = this.nodes[nodeKey]

    if (Object.keys(dependency.dependents).length === 1) {
      const instance = this.ecosystem._instances[nodeKey] as AtomInstance<
        any,
        any[],
        any
      >

      // unschedule destruction of this atom
      instance._cancelDestruction?.()
    }
  }
}
