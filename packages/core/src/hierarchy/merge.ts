import { Action, HierarchyConfig, Reducer } from '../types'
import { HierarchyType } from '../utils/general'
import { BranchNode, DiffNode, DiffTree } from '../utils/types'

/**
  Turns a diff tree into a single reducer.

  All child diff nodes must have `reducer` props themselves.

  Accepts configuration to create the state representation of this node,
  to get and set properties on that data type, to determine if the old
  state is a node, and to find the size of the node.
*/
const createBranchReducer = (
  children: DiffTree,
  { create, get, isNode, set, size }: HierarchyConfig
): Reducer => (oldState = create(), action: Action) => {
  // Make a new node to keep track of the values returned by
  // the child reducers.
  let newState = create()
  let hasChanges = false

  // Iterate over the child reducers, passing them their state slice
  // and the action and recording their results.
  Object.keys(children).forEach(key => {
    const { reducer } = children[key] as { reducer: Reducer } // we've ensured reducer exists at this point

    // Grab the old state slice
    const oldStatePiece = isNode(oldState) ? get(oldState, key) : undefined // yes, explicitly set it to undefined

    // Calculate the new value
    const newStatePiece = reducer(oldStatePiece, action)

    // Record the result
    newState = set(newState, key, newStatePiece)

    // Check for changes
    hasChanges || (hasChanges = newStatePiece !== oldStatePiece)
  })

  // Handle the case where `children` did not used to be an empty node.
  // This means there were changes, but our change detection failed
  // since we didn't actually iterate over anything.
  hasChanges ||
    (hasChanges =
      !isNode(oldState) || (!Object.keys(children).length && !!size(oldState)))

  // If nothing changed, discard the accumulated newState
  return hasChanges ? newState : oldState
}

/**
  Recursively destroys a tree, preventing memory leaks.

  Currently STORE is the only node type affected by this;
  stores need to unsubscribe() from and uninspect() their
  child stores.
*/
export function destroyTree(tree?: DiffNode) {
  if (!tree) return

  const { children, destroy } = tree as BranchNode

  if (destroy) destroy()

  if (!children) return // base case; this branch is now destroyed

  Object.values(children).forEach(destroyTree)
}

/**
  Merges two diff tree BRANCH nodes together.

  Really should only be used from `mergeDiffTrees()`
*/
export function mergeBranches(
  oldTree: DiffNode,
  newTree: BranchNode,
  hierarchyConfig: HierarchyConfig
): BranchNode {
  const mergedChildren = { ...(oldTree as BranchNode).children }

  // Iterate over the new tree's children
  Object.keys(newTree.children).forEach(key => {
    const newChild = newTree.children[key]
    const oldChild = (oldTree as BranchNode).children?.[key]

    // Attempt to recursively merge the two children
    // Let `mergeDiffTrees()` handle any destroying
    const mergedChild = mergeDiffTrees(oldChild, newChild, hierarchyConfig)

    // If the new node is NULL, kill it.
    if (mergedChild.type === HierarchyType.Null) {
      delete mergedChildren[key]

      return
    }

    mergedChildren[key] = mergedChild
  })

  return {
    children: mergedChildren,
    reducer: createBranchReducer(mergedChildren, hierarchyConfig),
    type: HierarchyType.Branch,
  }
}

/**
  Merges two diff trees together.

  Uses head recursion to merge the leaf nodes first.
  This allows this step to also find each node's reducer.
  (A node's children reducers need to exist before its own reducer can)

  Destroys any no-longer-used resources in the oldTree.

  The resulting tree will always have the type of the newTree.

  Dynamically injects reducers and stores into the hierarchy or
  replaces the hierarchy altogether.

  There are 4 types of nodes in this hierarchy:
    - BRANCH - indicates a branch (non-leaf) node
    - REDUCER - indicates a leaf node handled by this store
    - STORE - indicates a leaf node handled by another store
    - NULL - indicates a non-existent node, or node to be deleted

  BRANCH nodes will be deeply merged (recursively).

  All other nodes will be overwritten.
*/
export function mergeDiffTrees(
  oldTree: DiffNode | undefined,
  newTree: DiffNode,
  hierarchyConfig: HierarchyConfig
) {
  if (newTree.type !== HierarchyType.Branch) {
    destroyTree(oldTree)

    return newTree
  }

  if (!oldTree || oldTree.type !== HierarchyType.Branch) {
    destroyTree(oldTree)

    return mergeBranches({ type: HierarchyType.Null }, newTree, hierarchyConfig)
  }

  // They're both BRANCH nodes; recursively merge them
  return mergeBranches(oldTree, newTree, hierarchyConfig)
}

/**
  Deeply merges the new state tree into the old one.
*/
export function mergeStateTrees(
  oldStateTree: any,
  newStateTree: any,
  hierarchyConfig: HierarchyConfig
) {
  if (!hierarchyConfig.isNode(oldStateTree)) {
    return [newStateTree, newStateTree !== oldStateTree]
  }

  // TODO: Do we handle the case where the state used to be a tree, but is now a primitive?

  let hasChanges = false
  const mergedTree = hierarchyConfig.clone(oldStateTree)

  hierarchyConfig.iterate(newStateTree, (key, newVal) => {
    const oldVal = hierarchyConfig.get(mergedTree, key)
    const [clonedVal, childHasChanges] = hierarchyConfig.isNode(newVal)
      ? // Recursively merge the nested nodes.
        mergeStateTrees(oldVal, newVal, hierarchyConfig)
      : // Not a nested node (anymore, at least)
        [newVal, newVal !== oldVal]

    if (!childHasChanges) return

    if (!hasChanges) hasChanges = childHasChanges
    hierarchyConfig.set(mergedTree, key, clonedVal)
  })

  return [hasChanges ? mergedTree : oldStateTree, hasChanges]
}
