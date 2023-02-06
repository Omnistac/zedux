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
      dependency: AnyAtomInstance
      // string if `edge.flags & EdgeFlag.External` or the atom instance
      // hasn't been created yet ('cause the edge was created while the
      // instance was initializing. TODO: maybe make it so atom instances can
      // be added to the ecosystem before being fully initialized):
      dependent: AnyAtomInstance | string
      edge: DependentEdge
    },
    'edgeCreated'
  >('edgeCreated'),
  edgeRemoved: actionFactory<
    {
      dependency: AnyAtomInstance | SelectorCacheItem<any, any[]>
      dependent: AnyAtomInstance | SelectorCacheItem<any, any[]> | string // string if edge is External
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
  // either instance or selectorCache will always be defined, depending on the node type
  stateChanged: actionFactory<
    {
      action?: ActionChain
      instance?: AnyAtomInstance
      newState: any
      oldState: any
      reasons: EvaluationReason[]
      selectorCache?: SelectorCacheItem
    },
    'stateChanged'
  >('stateChanged'),
}
