import { actionTypes, metaTypes } from '../api/constants'
import { Store } from '../api/createStore'
import { addMeta } from '../api/meta'
import { Action, Branch, HierarchyDescriptor, Reducer } from '../types'
import {
  detailedTypeof,
  HierarchyType,
  isPlainObject,
  isZeduxStore,
} from '../utils/general'
import { DiffNode, DiffTree, RegisterSubStore } from '../utils/types'

/**
  Converts a Branch hierarchy descriptor to a diff node's children

  Really should only be used from `hierarchyDescriptorToDiffTree()`
*/
function branchToDiffNodeChildren(
  branch: Branch,
  registerSubStore: RegisterSubStore,
  currentPath: string[]
) {
  const children: DiffTree = {}

  Object.entries(branch).forEach(([key, val]) => {
    const newPath = [...currentPath, key]

    children[key] = hierarchyDescriptorToDiffTree(
      val,
      registerSubStore,
      newPath
    )
  })

  return children
}

/**
  Turns a non-branch node from a user-supplied hierarchy descriptor into a
  DiffNode object
*/
function nonBranchToDiffNode(
  type: HierarchyType,
  hierarchy: Reducer | Store,
  registerSubStore: RegisterSubStore,
  currentPath: string[]
): DiffNode {
  if (type === HierarchyType.Null) {
    return { type }
  }

  if (type === HierarchyType.Reducer) {
    return { type, reducer: hierarchy as Reducer }
  }

  // It's a Store hierarchy descriptor
  return {
    type: type as HierarchyType.Store,
    destroy: registerSubStore(currentPath, hierarchy as Store),
    reducer: wrapStoreInReducer(hierarchy as Store),
    store: hierarchy as Store,
  }
}

/**
  Determines the type of the given hierarchy descriptor.

  Throws a TypeError if the descriptor is invalid.
*/
export function getHierarchyType(descriptor: HierarchyDescriptor) {
  if (typeof descriptor === 'function') return HierarchyType.Reducer

  if (descriptor && isZeduxStore(descriptor)) return HierarchyType.Store

  if (isPlainObject(descriptor)) return HierarchyType.Branch

  if (DEV && descriptor != null) {
    throw new TypeError(
      `Zedux: store.use() - Hierarchy descriptor nodes must be reducers, stores, or plain objects. Received ${detailedTypeof(
        descriptor
      )}`
    )
  }

  return HierarchyType.Null
}

/**
  Turns a normal, user-supplied hierarchy descriptor into a diff tree for easy
  reducer hierarchy creating, diffing, merging, and destroying.

  Also figures out the reducer for non-branch nodes.
*/
export function hierarchyDescriptorToDiffTree(
  hierarchy: HierarchyDescriptor,
  registerSubStore: RegisterSubStore,
  currentPath: string[] = []
): DiffNode {
  const type = getHierarchyType(hierarchy)

  if (type !== HierarchyType.Branch) {
    return nonBranchToDiffNode(
      type,
      hierarchy as Reducer | Store,
      registerSubStore,
      currentPath
    )
  }

  // It's a Branch; recursively convert the whole tree. We don't need to supply
  // a reducer for this branch 'cause the merge process does that for us
  return {
    type,
    children: branchToDiffNodeChildren(
      hierarchy as Branch,
      registerSubStore,
      currentPath
    ),
  }
}

/**
  Creates a reducer that wraps the entry points of the given store.

  This reducer will propagate actions down the child store's reducers.

  Wraps all actions in the special INHERIT meta node to inform the child store's
  effects subscribers that this action was received from its parent store.

  Since the parent store also registers an effects subscriber on this child
  store, it will know not to propagate the inherited action from the child
  store. UPDATE: Actually, it doesn't even need to check - the parent store
  knows that it _isDispatching and can ignore child store actions while it is.
*/
export function wrapStoreInReducer<State>(store: Store<State>) {
  const reducer: Reducer = (state: State, action: Action) => {
    // If this is the special hydrate or partial hydrate action, re-create the
    // action's payload using the current state slice
    if (
      action.type === actionTypes.HYDRATE ||
      action.type === actionTypes.PARTIAL_HYDRATE
    ) {
      action = {
        type: actionTypes.HYDRATE,
        payload: state,
      }
    }

    // Tell the child store's effect subscribers that this action is inherited
    const inheritedAction = addMeta(action, metaTypes.INHERIT)

    return store.dispatch(inheritedAction)
  }

  return reducer
}
