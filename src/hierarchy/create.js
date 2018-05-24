import {
  BRANCH, NULL, REACTOR, STORE
} from './general'

import { actionTypes, metaTypes } from '../api/constants'
import { assertIsNullHierarchyDescriptorNode } from '../utils/errors'
import { isPlainObject, isZeduxStore } from '../utils/general'
import { addMeta } from '../utils/meta'


/**
  Converts a BRANCH hierarchy descriptor to a diff node's children

  Really should only be used from `hierarchyDescriptorToDiffTree()`
*/
export function branchToDiffNodeChildren(
  hierarchy,
  registerSubStore,
  currentPath
) {
  const children = {}

  Object.entries(hierarchy).forEach(([ key, val ]) => {
    const newPath = [ ...currentPath, key ]

    children[key] = hierarchyDescriptorToDiffTree(
      val,
      registerSubStore,
      newPath
    )
  })

  return children
}


/**
  Determines the type of the given hierarchy descriptor.

  Throws a TypeError if the descriptor is invalid.
*/
export function getHierarchyType(descriptor) {
  if (typeof descriptor === 'function') return REACTOR

  if (descriptor && isZeduxStore(descriptor)) return STORE

  if (isPlainObject(descriptor)) return BRANCH

  assertIsNullHierarchyDescriptorNode(descriptor)

  return NULL
}


/**
  Turns a normal, user-supplied hierarchy descriptor into a
  diff tree for easy reactor hierarchy creating, diffing,
  merging, and destroying.

  Also figures out the reactor for non-branch nodes.
*/
export function hierarchyDescriptorToDiffTree(
  hierarchy,
  registerSubStore,
  currentPath = []
) {
  const type = getHierarchyType(hierarchy)

  if (type !== BRANCH) {
    return nonBranchToDiffNode(type, hierarchy, registerSubStore, currentPath)
  }

  // It's a BRANCH; recursively convert the whole tree
  return {
    type,
    children: branchToDiffNodeChildren(hierarchy, registerSubStore, currentPath)
  }
}


export function nonBranchToDiffNode(
  type,
  hierarchy,
  registerSubStore,
  currentPath
) {
  if (type === NULL) {
    return { type }
  }

  if (type === REACTOR) {
    return { type, reactor: hierarchy }
  }

  // It's a STORE hierarchy descriptor
  return {
    type,
    destroy: registerSubStore(currentPath, hierarchy),
    reactor: wrapStoreInReactor(hierarchy),
    store: hierarchy
  }
}


/**
  Creates a reactor that wraps the entry points of the given store.

  This reactor will propagate actions down the child store's reducer
  and effects layers.

  Wraps all actions in the special INHERIT meta node to inform the
  child store's inspectors that this action was received from its
  parent store.
*/
export function wrapStoreInReactor(store) {
  const reactor = (state, action) => {

    // If this is the special hydrate or partial hydrate action,
    // re-create the action's payload using the current state slice
    if (
      action.type === actionTypes.HYDRATE
      || action.type === actionTypes.PARTIAL_HYDRATE
    ) {
      action = {
        type: actionTypes.HYDRATE,
        payload: state
      }
    }

    // Tell the child store not to dispatch this action to its effects layer
    action = addMeta(action, metaTypes.SKIP_EFFECTS)

    // Tell the child store's inspectors that this action is inherited
    action = addMeta(action, metaTypes.INHERIT)

    return store.dispatch(action)
  }


  reactor.effects = (state, action) => {

    // Tell the child store not to dispatch this action to its reducer layer
    action = addMeta(action, metaTypes.SKIP_REDUCERS)

    // Tell the child store's inspectors that this action is inherited
    action = addMeta(action, metaTypes.INHERIT)

    return store.dispatch(action)
  }


  return reactor
}
