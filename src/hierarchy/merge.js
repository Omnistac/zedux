import { BRANCH, NULL } from './general'


/**
  Turns a diff tree into a single reactor.

  All child diff nodes must have `reactor` props themselves.

  Accepts node options to create the state representation of this node,
  to get and set properties on that data type, to determine if the old
  state is a node, and to find the size of the node.
*/
export function createBranchReactor(
  children,
  { create, get, isNode, set, size }
) {
  const reactor = (oldState = create(), action) => {

    // Make a new node to keep track of the values returned by
    // the child reactors.
    let newState = create()
    let hasChanges = false

    const childrenEntries = Object.entries(children)

    // Iterate over the child reactors, passing them their state slice
    // and the action and recording their results.
    childrenEntries.forEach(([ key, { reactor } ]) => {

      // Grab the old state slice
      const oldStatePiece = isNode(oldState)
        ? get(oldState, key)
        : undefined // yes, explicitly set it to undefined

      // Calculate the new value
      const newStatePiece = reactor(oldStatePiece, action)

      // Record the result
      newState = set(newState, key, newStatePiece)

      // Check for changes
      hasChanges || (hasChanges = newStatePiece !== oldStatePiece)
    })

    // Handle the case where `children` did not used to be an empty node
    if (!isNode(oldState) || !childrenEntries.length && size(oldState)) {
      return newState
    }

    // If nothing changed, discard the accumulated newState
    return hasChanges ? newState : oldState
  }


  reactor.process = (dispatch, action, state) => {
    Object.entries(children).forEach(([ key, { reactor: { process } } ]) => {
      if (typeof process !== 'function') return

      const statePiece = get(state, key)

      process(dispatch, action, statePiece)
    })
  }


  return reactor
}


/**
  Recursively destroys a tree, preventing memory leaks.

  Currently STORE is the only node type affected by this;
  stores need to unsubscribe() from and uninspect() their
  child stores.
*/
export function destroyTree(tree) {
  if (!tree) return

  const { children, destroy } = tree

  if (destroy) destroy()

  if (!children) return // base case; this branch is now destroyed

  Object.values(children).forEach(destroyTree)
}


/**
  Merges two diff tree BRANCH nodes together.

  Really should only be used from `mergeDiffTrees()`
*/
export function mergeBranches(oldTree, newTree, nodeOptions) {
  const mergedChildren = { ...oldTree.children }

  // Iterate over the new tree's children
  Object.entries(newTree.children).forEach(([ key, newChild ]) => {

    const oldChild = oldTree[key]

    // Attempt to recursively merge the two children
    // Let `mergeDiffTrees()` handle any destroying
    const mergedChild = mergeDiffTrees(oldChild, newChild, nodeOptions)

    // If the new node is NULL, kill it.
    if (mergedChild.type === NULL) {
      return delete mergedChildren[key]
    }

    mergedChildren[key] = mergedChild
  })

  return {
    type: BRANCH,
    reactor: createBranchReactor(mergedChildren, nodeOptions),
    children: mergedChildren
  }
}


/**
  Merges two diff trees together.

  Uses head recursion to merge the leaf nodes first.
  This allows this step to also find each node's reactor.
  (A node's children reactors need to exist before its own reactor can)

  Destroys any no-longer-used resources in the oldTree.

  The resulting tree will always have the type of the newTree.

  Dynamically injects reactors and stores into the hierarchy or
  replaces the hierarchy altogether.

  There are 4 types of nodes in this hierarchy:
    - BRANCH - indicates a branch (non-leaf) node
    - REACTOR - indicates a leaf node handled by this store
    - STORE - indicates a leaf node handled by another store
    - NULL - indicates a non-existent node, or node to be deleted

  BRANCH nodes will be deeply merged (recursively).

  All other nodes will be overwritten.
*/
export function mergeDiffTrees(oldTree, newTree, nodeOptions) {
  if (newTree.type !== BRANCH) {
    destroyTree(oldTree)

    return newTree
  }

  if (!oldTree || oldTree.type !== BRANCH) {
    destroyTree(oldTree)

    return mergeBranches({}, newTree, nodeOptions)
  }

  // They're both BRANCH nodes; recursively merge them
  return mergeBranches(oldTree, newTree, nodeOptions)
}


/**
  Deeply merges the new state tree into the old one.
*/
export function mergeStateTrees(
  oldStateTree,
  newStateTree,
  nodeOptions
) {
  if (!nodeOptions.isNode(oldStateTree)) return newStateTree

  const mergedTree = nodeOptions.clone(oldStateTree)

  nodeOptions.iterate(newStateTree, (key, val) => {
    const clonedVal = nodeOptions.isNode(val)

      // Recursively merge the nested nodes.
      ? mergeStateTrees(nodeOptions.get(mergedTree, key), val, nodeOptions)

      // Not a nested node (anymore, at least)
      : val

    nodeOptions.set(
      mergedTree,
      key,
      clonedVal
    )
  })

  return mergedTree
}