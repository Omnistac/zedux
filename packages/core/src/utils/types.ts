import { Store } from '../api/createStore'
import { Reducer } from '../types'
import {
  BranchNodeType,
  NullNodeType,
  ReducerNodeType,
  StoreNodeType,
} from './general'

export type HierarchyNodeType =
  | typeof BranchNodeType
  | typeof NullNodeType
  | typeof ReducerNodeType
  | typeof StoreNodeType

export interface BranchNode extends HierarchyNodeBase {
  children: Hierarchy
  reducer?: Reducer
  type: BranchNodeType
}

export type HierarchyNode = BranchNode | NullNode | ReducerNode | StoreNode

export interface HierarchyNodeBase {
  destroy?: () => void
  type: HierarchyNodeType
}

export interface Hierarchy {
  [key: string]: HierarchyNode
}

export interface Job {
  /**
   * `W`eight - the weight of the node (for EvaluateGraphNode jobs).
   */
  W?: number

  /**
   * `j`ob - the actual task to run.
   */
  j: () => void

  /**
   * `T`ype - the job type. Different types get different priorities in the
   * scheduler.
   *
   * 0 - UpdateStore
   * 1 - InformSubscribers
   * 2 - EvaluateGraphNode
   * 3 - UpdateExternalDependent
   */
  T: 0 | 1 | 2 | 3
}

export interface NullNode extends HierarchyNodeBase {
  reducer?: undefined
  type: NullNodeType
}

export interface ReducerNode extends HierarchyNodeBase {
  reducer: Reducer
  type: ReducerNodeType
}

export interface StoreNode extends HierarchyNodeBase {
  reducer: Reducer
  store: Store
  type: StoreNodeType
}

export type RegisterSubStore = (path: string[], store: Store) => () => void
