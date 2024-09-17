import { ActionChain, actionFactory } from '@zedux/core'
import { Ecosystem } from '../classes/Ecosystem'
import {
  AnyAtomInstance,
  AnyAtomTemplate,
  EvaluationReason,
  GraphEdge,
  LifecycleStatus,
} from '../types/index'
import { type GraphNode } from '../classes/GraphNode'

export const pluginActions = {
  ecosystemWiped: actionFactory<{ ecosystem: Ecosystem }, 'ecosystemWiped'>(
    'ecosystemWiped'
  ),
  edgeCreated: actionFactory<
    {
      dependency: GraphNode
      dependent: GraphNode | string // string if edge is External
      edge: GraphEdge
    },
    'edgeCreated'
  >('edgeCreated'),
  edgeRemoved: actionFactory<
    {
      dependency: GraphNode
      dependent: GraphNode | string // string if edge is External
      edge: GraphEdge
    },
    'edgeRemoved'
  >('edgeRemoved'),
  evaluationFinished: actionFactory<
    {
      node: GraphNode
      time: number
    },
    'evaluationFinished'
  >('evaluationFinished'),
  instanceReused: actionFactory<{
    instance: AnyAtomInstance
    template: AnyAtomTemplate
  }>('instanceReused'),
  stateChanged: actionFactory<
    {
      action?: ActionChain
      newState: any
      node: GraphNode
      oldState: any
      reasons: EvaluationReason[]
    },
    'stateChanged'
  >('stateChanged'),
  statusChanged: actionFactory<
    {
      newStatus: LifecycleStatus
      node: GraphNode
      oldStatus: LifecycleStatus
    },
    'statusChanged'
  >('statusChanged'),
}
