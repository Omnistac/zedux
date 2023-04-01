import { internalTypes } from '../api/constants'
import { Store } from '../api/createStore'
import { is } from '../api/is'
import {
  Action,
  ActionMeta,
  Branch,
  HierarchyDescriptor,
  Reducer,
} from '../types'
import {
  BranchNodeType,
  detailedTypeof,
  isPlainObject,
  NullNodeType,
  ReducerNodeType,
  StoreNodeType,
} from '../utils/general'
import {
  HierarchyNode,
  Hierarchy,
  HierarchyNodeType,
  RegisterSubStore,
} from '../utils/types'

/**
 * Converts a Branch hierarchy descriptor to a HierarchyNode's children
 *
 * Really should only be used from `hierarchyDescriptorToHierarchy()`
 */
function branchToHierarchyChildren(
  branch: Branch,
  registerSubStore: RegisterSubStore,
  currentPath: string[]
) {
  const children: Hierarchy = {}

  Object.entries(branch).forEach(([key, val]) => {
    const newPath = [...currentPath, key]

    children[key] = hierarchyDescriptorToHierarchy(
      val,
      registerSubStore,
      newPath
    )
  })

  return children
}

/**
 * Turns a non-branch node from a user-supplied hierarchy descriptor into a
  HierarchyNode object
 */
function nonBranchToHierarchyNode(
  type: HierarchyNodeType,
  hierarchy: Reducer | Store,
  registerSubStore: RegisterSubStore,
  currentPath: string[]
): HierarchyNode {
  if (type === NullNodeType) {
    return { type }
  }

  if (type === ReducerNodeType) {
    return { type, reducer: hierarchy as Reducer }
  }

  // It's a Store hierarchy descriptor
  return {
    type: type as StoreNodeType,
    destroy: registerSubStore(currentPath, hierarchy as Store),
    reducer: wrapStoreInReducer(hierarchy as Store),
    store: hierarchy as Store,
  }
}

/**
 * Determines the HierarchyNodeType of the given hierarchy descriptor.
 *
 * Throws a TypeError if the descriptor is invalid.
 */
export function getHierarchyType(descriptor: HierarchyDescriptor) {
  if (typeof descriptor === 'function') return ReducerNodeType

  if (descriptor && is(descriptor, Store)) return StoreNodeType

  if (isPlainObject(descriptor)) return BranchNodeType

  if (DEV && descriptor != null) {
    throw new TypeError(
      `Zedux: store.use() - Hierarchy descriptor nodes must be reducers, stores, or plain objects. Received ${detailedTypeof(
        descriptor
      )}`
    )
  }

  return NullNodeType
}

/**
 * Turns a normal, user-supplied hierarchy descriptor into a Hierarchy for easy
 * reducer hierarchy creating, diffing, merging, and destroying.
 *
 * Also figures out the reducer for non-branch nodes.
 */
export function hierarchyDescriptorToHierarchy(
  hierarchy: HierarchyDescriptor,
  registerSubStore: RegisterSubStore,
  currentPath: string[] = []
): HierarchyNode {
  const type = getHierarchyType(hierarchy)

  if (type !== BranchNodeType) {
    return nonBranchToHierarchyNode(
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
    children: branchToHierarchyChildren(
      hierarchy as Branch,
      registerSubStore,
      currentPath
    ),
  }
}

/**
 * Creates a reducer that wraps the entry points of the given store.
 *
 * This reducer will propagate actions down the child store's reducers.
 *
 * Wraps all actions in the special `inherit` meta node to inform the child
 * store's effects subscribers that this action was received from its parent
 * store.
 *
 * Since the parent store also registers an effects subscriber on this child
 * store, it will know not to propagate the inherited action from the child
 * store. UPDATE: Actually, it doesn't even need to check - the parent store
 * knows that it _isDispatching and can ignore child store actions while it is.
 */
export function wrapStoreInReducer<State>(store: Store<State>) {
  const reducer: Reducer = (state: State, action: Action) => {
    // If this is the special hydrate or partial hydrate action, re-create the
    // action's payload using the current state slice
    if (
      action.type === internalTypes.hydrate ||
      action.type === internalTypes.merge
    ) {
      action = {
        type: internalTypes.hydrate,
        payload: state,
      }
    }

    // Tell the child store's effect subscribers that this action is inherited
    const inheritedAction: ActionMeta = {
      metaType: internalTypes.inherit,
      payload: action,
    }

    return store.dispatch(inheritedAction)
  }

  return reducer
}
