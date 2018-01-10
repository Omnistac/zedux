import {
  assertIsNullHierarchyDescriptorNode,
  invalidDelegation
} from './errors'

import { addMeta, getMetaPayload, removeMeta } from './meta'
import { isPlainObject, isZeduxStore } from './general'
import { actionTypes, metaTypes } from '../api/constants'


/*
  These are the valid reactor hierarchy node types.
*/
export const HIERARCHY_DESCRIPTOR = 'HIERARCHY_DESCRIPTOR'
export const NULL = 'NULL'
export const REACTOR = 'REACTOR'
export const STORE = 'STORE'


/**
  Delegates an action to a child store.

  Does nothing if the special DELEGATE meta node is not present
  in the action meta chain.

  This expects the `metaPayload` of the DELEGATE meta node to be
  an array containing a path of nodes describing the child store's
  location in the parent store's current hierarchy descriptor.

  Delegated actions will not be handled by the parent store at all.
*/
export function delegate(currentHierarchy, action) {
  const subStorePath = getMetaPayload(action, metaTypes.DELEGATE)

  if (!subStorePath) return false

  for (let i = 0; i < subStorePath.length; i++) {
    const node = subStorePath[i]

    currentHierarchy = currentHierarchy[node]

    if (!currentHierarchy) {
      throw new ReferenceError(invalidDelegation(subStorePath))
    }
  }

  if (!isZeduxStore(currentHierarchy)) {
    throw new TypeError(invalidDelegation(subStorePath))
  }

  currentHierarchy.dispatch(removeMeta(action, metaTypes.DELEGATE))

  return true
}


/**
  Determines the node type of the given node.

  Valid node types are [ HIERARCHY_DESCRIPTOR, NULL, REACTOR, STORE ]

  Throws a TypeError if the node is invalid.
*/
export function getHierarchyNodeType(node) {
  if (typeof node === 'function') return REACTOR

  if (!isPlainObject(node)) {
    assertIsNullHierarchyDescriptorNode(node)

    return NULL
  }

  return isZeduxStore(node)
    ? STORE
    : HIERARCHY_DESCRIPTOR
}


/**
  Recursively turns each of the nodes in a hierarchy descriptor
  into a reactor.
*/
export function hierarchyDescriptorChildrenToReactors(
  hierarchyDescriptor,
  nodeOptions,
  registerSubStore,
  currentPath
) {
  const reactors = {}

  Object.entries(hierarchyDescriptor).forEach(([ key, subHierarchy ]) => {
    const newPath = [ ...currentPath, key ]

    const subReactor = hierarchyNodeToReactor(
      subHierarchy,
      nodeOptions,
      registerSubStore,
      newPath
    )

    if (subReactor) reactors[key] = subReactor
  })

  return reactors
}


/**
  Turns a hierarchy descriptor into a single reactor.

  This assumes that all children (if any) of this hierarchy
  descriptor are already reactors themselves.

  Accepts node options to create the state representation of this node
  and to get and set properties on that data type.
*/
export function hierarchyDescriptorToReactor(reactors, { create, get, set }) {
  const reactor = (oldState = create(), action) => {

    let newState = create()
    let hasChanges = false

    Object.entries(reactors).forEach(([ key, reducer ]) => {
      const oldStatePiece = get(oldState, key)
      const newStatePiece = reducer(oldStatePiece, action)

      newState = set(newState, key, newStatePiece)
      hasChanges || (hasChanges = newStatePiece !== oldStatePiece)
    })

    return hasChanges ? newState : oldState
  }


  reactor.process = (dispatch, action, state) => {
    Object.entries(reactors).forEach(([ key, { process } ]) => {
      if (typeof process !== 'function') return

      const statePiece = get(state, key)

      process(dispatch, action, statePiece)
    })
  }


  return reactor
}


/**
  Turns a hierarchy descriptor node into a single reactor.
*/
export function hierarchyNodeToReactor(
  hierarchy,
  nodeOptions,
  registerSubStore,
  currentPath = []
) {
  const nodeType = getHierarchyNodeType(hierarchy)

  if (nodeType === NULL) return null
  if (nodeType === REACTOR) return hierarchy
  if (nodeType === STORE) {
    registerSubStore(currentPath, hierarchy)

    return wrapStoreInReactor(hierarchy)
  }

  const reactors = hierarchyDescriptorChildrenToReactors(
    hierarchy,
    nodeOptions,
    registerSubStore,
    currentPath
  )

  return hierarchyDescriptorToReactor(reactors, nodeOptions)
}


/**
  Dynamically injects reactors and stores into the hierarchy or
  replaces the hierarchy altogether.

  There are 4 types of nodes in this hierarchy:
    - HIERARCHY_DESCRIPTOR - indicates a branch (non-leaf) node
    - REACTOR - indicates a leaf node handled by this store
    - STORE - indicates a leaf node handled by another store
    - NULL - indicates a non-existent node, or node to be deleted

  HIERARCHY_DESCRIPTOR nodes will be deeply merged (recursively).

  All other nodes will be overwritten.
*/
export function mergeHierarchyDescriptorNodes(oldHierarchy, newHierarchy) {
  const newType = getHierarchyNodeType(newHierarchy)

  if (newType === NULL) {
    return null
  }

  if (newType === REACTOR || newType === STORE) {
    return newHierarchy
  }

  const oldType = getHierarchyNodeType(oldHierarchy)

  return oldType === HIERARCHY_DESCRIPTOR
    ? mergeHierarchyDescriptors(oldHierarchy, newHierarchy)
    : newHierarchy
}


/**
  Recursively merges two hierarchy descriptors (objects).

  Existing keys in the oldHierarchyDescriptor will be overwritten.
*/
export function mergeHierarchyDescriptors(
  oldHierarchyDescriptor,
  newHierarchyDescriptor
) {
  const mergedHierarchy = { ...oldHierarchyDescriptor }

  // Go through all the entries on the new branch node
  Object.entries(newHierarchyDescriptor).forEach(([ key, newVal ]) => {
    const oldVal = oldHierarchyDescriptor[key]

    // Attempt to recursively merge the two nodes
    const mergedSubHierarchy = mergeHierarchyDescriptorNodes(oldVal, newVal)

    // We got a null signal; delete the node
    if (!mergedSubHierarchy) {
      return delete mergedHierarchy[key]
    }

    mergedHierarchy[key] = mergedSubHierarchy
  })

  return mergedHierarchy
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


/**
  Propagates a state change from a child store to a parent.

  Recursively finds the child store's node in the parent store's
  state tree and re-creates all the nodes down that path.

  #immutability
*/
export function propagateChange(
  currentState,
  subStorePath,
  newSubStoreState,
  nodeOptions
) {
  if (!subStorePath.length) return newSubStoreState

  let newNode = nodeOptions.clone(currentState)
  const nextNodeKey = subStorePath[0]

  newNode = nodeOptions.set(newNode, nextNodeKey, propagateChange(
    currentState[nextNodeKey],
    subStorePath.slice(1),
    newSubStoreState,
    nodeOptions
  ))

  return newNode
}


/**
  Creates a reactor that wraps the entry points of the given store.

  This reactor will propagate actions down the child store's reducer
  and processor layers.

  Wraps all actions in the special INHERIT meta node to inform the
  child store's inspectors that this action was received from its
  parent store.
*/
export function wrapStoreInReactor(store) {
  const reactor = (state, action) => {

    // If this is the special hydrate action, re-create the action's
    // payload using the current state slice
    if (
      action.type === actionTypes.HYDRATE
      || action.type === actionTypes.PARTIAL_HYDRATE
    ) {
      action = {
        type: actionTypes.HYDRATE,
        payload: state
      }
    }

    // Tell the child store not to dispatch this action to its processor layer
    action = addMeta(action, metaTypes.SKIP_PROCESSORS)

    // Tell the child store's inspectors that this action is inherited
    action = addMeta(action, metaTypes.INHERIT)

    return store.dispatch(action)
  }


  reactor.process = (dispatch, action) => {

    // Tell the child store not to dispatch this action to its reducer layer
    action = addMeta(action, metaTypes.SKIP_REDUCERS)

    // Tell the child store's inspectors that this action is inherited
    action = addMeta(action, metaTypes.INHERIT)

    return store.dispatch(action)
  }


  return reactor
}
