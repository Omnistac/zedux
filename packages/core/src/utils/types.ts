import { Reducer, Store } from '../types'
import { HierarchyType } from './general'

export interface DiffNode {
  children?: DiffTree
  destroy?: () => void
  reducer?: Reducer
  store?: Store
  type: HierarchyType
}

export interface DiffTree {
  [key: string]: DiffNode
}

export type RegisterSubStore = (path: string[], store: Store) => () => void
