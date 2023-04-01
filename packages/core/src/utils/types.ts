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
