import { ActionChain, actionFactory } from '@zedux/core'
import { Ecosystem } from '../classes/Ecosystem'
import {
  ActiveState,
  AnyAtomInstance,
  DependentEdge,
  EvaluationReason,
} from '../types'
import { SelectorCacheItem } from '../classes/SelectorCache'

export const pluginActions = {
  activeStateChanged: actionFactory<
    {
      instance: AnyAtomInstance
      newActiveState: ActiveState
      oldActiveState: ActiveState
    },
    'activeStateChanged'
  >('activeStateChanged'),
  ecosystemWiped: actionFactory<{ ecosystem: Ecosystem }, 'ecosystemWiped'>(
    'ecosystemWiped'
  ),
  edgeCreated: actionFactory<
    {
      dependency: AnyAtomInstance | SelectorCacheItem
      // string if `edge.flags & External`:
      dependent: AnyAtomInstance | SelectorCacheItem | string
      edge: DependentEdge
    },
    'edgeCreated'
  >('edgeCreated'),
  edgeRemoved: actionFactory<
    {
      dependency: AnyAtomInstance | SelectorCacheItem
      dependent: AnyAtomInstance | SelectorCacheItem | string // string if edge is External
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
        cache: SelectorCacheItem
        time: number
      },
    'evaluationFinished'
  >('evaluationFinished'),
  // either cache or instance will always be defined, depending on the node type
  stateChanged: actionFactory<
    {
      action?: ActionChain
      cache?: SelectorCacheItem
      instance?: AnyAtomInstance
      newState: any
      oldState: any
      reasons: EvaluationReason[]
    },
    'stateChanged'
  >('stateChanged'),
}
