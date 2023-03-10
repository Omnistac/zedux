import { ActionChain, actionFactory } from '@zedux/core'
import { Ecosystem } from '../classes/Ecosystem'
import {
  LifecycleStatus,
  AnyAtomInstance,
  DependentEdge,
  EvaluationReason,
  AnyAtomTemplate,
} from '../types'
import { SelectorCache } from '../classes/Selectors'

export const pluginActions = {
  ecosystemWiped: actionFactory<{ ecosystem: Ecosystem }, 'ecosystemWiped'>(
    'ecosystemWiped'
  ),
  edgeCreated: actionFactory<
    {
      dependency: AnyAtomInstance | SelectorCache
      // string if `edge.flags & External`:
      dependent: AnyAtomInstance | SelectorCache | string
      edge: DependentEdge
    },
    'edgeCreated'
  >('edgeCreated'),
  edgeRemoved: actionFactory<
    {
      dependency: AnyAtomInstance | SelectorCache
      dependent: AnyAtomInstance | SelectorCache | string // string if edge is External
      edge: DependentEdge
    },
    'edgeRemoved'
  >('edgeRemoved'),
  evaluationFinished: actionFactory<
    | {
        instance: AnyAtomInstance
        time: number
      }
    | {
        cache: SelectorCache
        time: number
      },
    'evaluationFinished'
  >('evaluationFinished'),
  instanceReused: actionFactory<{
    instance: AnyAtomInstance
    template: AnyAtomTemplate
  }>('instanceReused'),
  // either cache or instance will always be defined, depending on the node type
  stateChanged: actionFactory<
    {
      action?: ActionChain
      cache?: SelectorCache
      instance?: AnyAtomInstance
      newState: any
      oldState: any
      reasons: EvaluationReason[]
    },
    'stateChanged'
  >('stateChanged'),
  statusChanged: actionFactory<
    {
      instance: AnyAtomInstance
      newStatus: LifecycleStatus
      oldStatus: LifecycleStatus
    },
    'statusChanged'
  >('statusChanged'),
}
