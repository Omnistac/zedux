import {
  DependentEdge,
  EvaluationReason,
  EvaluationTargetType,
  EvaluationType,
  GraphEdgeSignal,
} from '../types'
import {
  EcosystemGraphNode,
  generateNodeId,
  JobType,
  UpdateExternalDependentJob,
} from '../utils'
import { Ecosystem } from './Ecosystem'
import { AtomInstance } from './instances/AtomInstance'
import { AtomInstanceBase } from './instances/AtomInstanceBase'
import { Ghost } from './Ghost'
import { ZeduxPlugin } from '.'

/**
 * The flag score determines job priority in the scheduler. Scores range from
 * 0-7. Lower score = higher prio. Examples:
 *
 * 0 = implicit-internal-dynamic
 * 3 = explicit-external-dynamic
 * 7 = explicit-external-static
 */
const getFlagScore = (dependentEdge: DependentEdge) => {
  let score = 0

  if (dependentEdge.isStatic) score += 4
  if (dependentEdge.isExternal) score += 2
  if (dependentEdge.isExplicit) score += 1

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
    isExplicit = false,
    shouldUpdate?: (state: State) => boolean // used for selectors
  ) {
    const dependency = this.nodes[dependencyKey]
    const newEdge: DependentEdge = {
      createdAt: Date.now(),
      isExplicit,
      isStatic,
      operation,
      shouldUpdate,
    }

    // draw graph edge between dependent and dependency
    this.nodes[dependentKey].dependencies[dependencyKey] = true
    dependency.dependents[dependentKey] = newEdge

    this.unscheduleDestruction(dependencyKey)

    // static dependencies don't change a node's weight
    if (!isStatic) this.recalculateWeight(dependentKey, dependency.weight)

    if (this.ecosystem.mods.edgeCreated) {
      this.ecosystem.modsMessageBus.dispatch(
        ZeduxPlugin.actions.edgeCreated({
          dependency: this.ecosystem._instances[dependencyKey],
          dependent: this.ecosystem._instances[dependentKey] || dependentKey, // unfortunate but not changing for now
          edge: newEdge,
        })
      )
    }

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

  public registerGhostDependent<State>(
    dependency: AtomInstanceBase<State, any[], any>,
    callback: DependentEdge['callback'],
    operation: string,
    isStatic: boolean,
    isExplicit = false,
    isAtomSelector = false,
    id = generateNodeId()
  ) {
    const nodeKey = dependency.keyHash
    const node = this.nodes[nodeKey]

    const newEdge: DependentEdge = {
      callback,
      createdAt: Date.now(),
      isExplicit,
      isAtomSelector,
      isExternal: true,
      isGhost: true,
      isStatic,
      operation,
    }

    // would be nice if React provided a way to know that multiple hooks were
    // part of the same component
    node.dependents[id] = newEdge
    this.unscheduleDestruction(nodeKey)

    const ghost = new Ghost(this.ecosystem, dependency, id, newEdge, () => {
      if (newEdge.task) {
        this.ecosystem._scheduler.unscheduleJob(newEdge.task)
      }

      delete node.dependents[id]
      this.scheduleInstanceDestruction(dependency.keyHash)

      if (this.ecosystem.mods.edgeRemoved) {
        this.ecosystem.modsMessageBus.dispatch(
          ZeduxPlugin.actions.edgeRemoved({
            dependency,
            edge: newEdge,
            dependent: id,
          })
        )
      }
    })

    this.ecosystem._scheduler.scheduleGhostCleanup(ghost)

    if (this.ecosystem.mods.ghostEdgeCreated) {
      this.ecosystem.modsMessageBus.dispatch(
        ZeduxPlugin.actions.ghostEdgeCreated({ ghost })
      )
    }

    return ghost
  }

  public removeDependencies(dependentKey: string) {
    const edges = this.nodes[dependentKey].dependencies

    if (!edges) return

    Object.keys(edges).forEach(dependencyKey => {
      this.removeDependency(dependentKey, dependencyKey)
    })
  }

  // Should only be used internally
  public removeDependency(dependentKey: string, dependencyKey: string) {
    const dependency = this.nodes[dependencyKey]

    // erase graph edge between dependent and dependency
    delete this.nodes[dependentKey].dependencies[dependencyKey]

    // TODO: This check should be completely unnecessary. Why would the
    // dependent still have an edge to this dependency if this dependency has
    // been cleaned up? Kill this check with amazing tests.
    if (!dependency) return

    const dependentEdge = dependency.dependents[dependentKey]
    delete dependency.dependents[dependentKey]

    // static dependencies don't change a node's weight
    if (!dependentEdge.isStatic) {
      this.recalculateWeight(dependentKey, -dependency.weight)
    }

    // TODO: is there a way to clean up any currently-scheduled jobs created by
    // this edge?

    if (this.ecosystem.mods.edgeRemoved) {
      this.ecosystem.modsMessageBus.dispatch(
        ZeduxPlugin.actions.edgeRemoved({
          dependency: this.ecosystem._instances[dependencyKey],
          dependent: this.ecosystem._instances[dependentKey],
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

    // Remove this dependency from all its dependents and recalculate all weights recursively
    Object.keys(node.dependents).forEach(dependentKey => {
      const dependentEdge = node.dependents[dependentKey]
      const flagScore = getFlagScore(dependentEdge)

      if (dependentEdge.isExternal) {
        const job: UpdateExternalDependentJob = {
          flagScore,
          task: () => dependentEdge.callback?.(GraphEdgeSignal.Destroyed),
          type: JobType.UpdateExternalDependent,
        }

        // AtomSelectors register "external" dependencies, but they aren't
        // actually external. Run them before external tasks and make sure they
        // get filtered out on scheduler wipe by lowering their flagScore by 2
        // (2 means external)
        if (dependentEdge.isAtomSelector) {
          job.flagScore -= 2
        }

        this.ecosystem._scheduler.scheduleJob(job)
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

    Object.entries(node.dependents).forEach(([dependentKey, dependentEdge]) => {
      // static deps don't update and if edge.task exists, this edge has
      // already been scheduled
      if (dependentEdge.isStatic || dependentEdge.task) return

      const flagScore = getFlagScore(dependentEdge)

      // let internal dependents (other atoms) schedule their own jobs
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
