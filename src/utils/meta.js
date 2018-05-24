export function addMeta(action, metaType, metaData) {
  let wrappedAction = {
    metaType,
    payload: action
  }

  if (metaData) wrappedAction.metaData = metaData

  return wrappedAction
}


export function getMetaData(action, metaType) {
  while (!action.type) {
    if (action.metaType === metaType) return action.metaData

    action = action.payload
  }
}


export function hasMeta(action, metaType) {
  while (!action.type) {
    if (action.metaType === metaType) return true

    action = action.payload
  }

  return false
}


export function removeAllMeta(action) {
  while (!action.type) {
    action = action.payload
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

  while (!currentNode.type) {

    if (currentNode.metaType === metaType) {
      return getNewRoot(currentNode, prevNode, rootNode)
    }

    // Move down the chain
    let clonedNode = { ...currentNode }

    prevNode && (prevNode.payload = clonedNode)

    prevNode = clonedNode
    currentNode = currentNode.payload

    // If this will be the new root, remember it
    rootNode || (rootNode = prevNode)
  }

  // No match found; return the original meta chain
  return action
}





function getNewRoot(currentNode, prevNode, rootNode) {

  // If the match is at the top layer, just return the next layer
  if (!prevNode) return currentNode.payload

  // If the match is at least one layer deep, swap out the target layer
  // and return the new root of the meta chain
  prevNode.payload = currentNode.payload

  return rootNode
}
