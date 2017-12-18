export function addMeta(action, metaType, metaPayload) {
  let wrappedAction = {
    metaType,
    action
  }

  if (metaPayload) wrappedAction.metaPayload = metaPayload

  return wrappedAction
}


export function getMetaPayload(action, metaType) {
  while (action.action) {
    if (action.metaType === metaType) return action.metaPayload

    action = action.action
  }
}


export function hasMeta(action, metaType) {
  while (action.action) {
    if (action.metaType === metaType) return true

    action = action.action
  }

  return false
}


export function removeAllMeta(action) {
  while (action.action) {
    action = action.action
  }

  return action
}


/**
  Removes the first found meta node with the given metaType in
  the given meta chain

  The metaType does not have to exist in the meta chain
  (though this'll be pretty inefficient and wasteful if it doesn't).
*/
export function removeMeta(action, metaType) {
  let currentNode = action
  let prevNode = null
  let rootNode = null

  while (currentNode.action) {

    if (currentNode.metaType === metaType) {
      return getNewRoot(currentNode, prevNode, rootNode)
    }

    // Move down the chain
    let clonedNode = { ...currentNode }

    if (prevNode) prevNode.action = clonedNode

    prevNode = clonedNode
    currentNode = currentNode.action

    // If this will be the new root, remember it
    if (!rootNode) {
      rootNode = prevNode
    }
  }

  // No match found; return the original meta chain
  return action
}





function getNewRoot(currentNode, prevNode, rootNode) {

  // If the match is at the top layer, just return the next layer
  if (!prevNode) return currentNode.action

  // If the match is at least one layer deep, swap out the target layer
  // and return the new root of the meta chain
  prevNode.action = currentNode.action

  return rootNode
}
