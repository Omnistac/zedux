import { Store } from '../api/createStore'
import { MachineStore } from '../api/MachineStore'
import { EffectData, Reducer } from '../types'
import { HierarchyType } from './general'

export interface BranchNode extends DiffNodeBase {
  children: DiffTree
  reducer?: Reducer
  type: HierarchyType.Branch
}

export type DiffNode = BranchNode | NullNode | ReducerNode | StoreNode

export interface DiffNodeBase {
  destroy?: () => void
  type: HierarchyType
}

export interface DiffTree {
  [key: string]: DiffNode
}

export type MachineEffectHandler<
  StateNames extends string = string,
  EventNames extends string = string,
  Context extends Record<string, any> | undefined = undefined
> = (
  effectData: EffectData<
    MachineStateType<StateNames, Context>,
    MachineStore<StateNames, EventNames, Context>
  >
) => void

export interface MachineStateType<
  StateNames extends string = string,
  Context extends Record<string, any> | undefined = undefined
> {
  value: StateNames
  context: Context
}

export interface NullNode extends DiffNodeBase {
  reducer?: undefined
  type: HierarchyType.Null
}

export interface ReducerNode extends DiffNodeBase {
  reducer: Reducer
  type: HierarchyType.Reducer
}

export interface StoreNode extends DiffNodeBase {
  reducer: Reducer
  store: Store
  type: HierarchyType.Store
}

export type RegisterSubStore = (path: string[], store: Store) => () => void
