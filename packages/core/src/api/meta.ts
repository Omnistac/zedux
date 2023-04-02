import { detailedTypeof } from './detailedTypeof'
import { Action, ActionChain, ActionMeta } from '../types'

const assertActionExists = (action: ActionChain) => {
  if (action) return

  throw new Error(
    `Zedux: Invalid action chain. The last node in the chain must be either a valid action object with a non-empty "type" property or an effect with a non-empty "effectType" property. Received ${detailedTypeof(
      action
    )}`
  )
}

const getNewRoot = <T extends ActionChain>(
  currentNode: T,
  prevNode: T | null,
  rootNode: T | null
): T => {
  // If the match is at the top layer, just return the next layer
  if (!prevNode || !rootNode) return currentNode.payload

  // If the match is at least one layer deep, swap out the target layer
  // and return the new root of the action chain
  prevNode.payload = currentNode.payload

  return rootNode
}

/**
 * Returns the value of the metaData field of the first ActionMeta object in the
 * chain with the given metaType.
 */
export const getMetaData = (action: ActionChain, metaType: string) => {
  while ((action as ActionMeta).metaType) {
    if ((action as ActionMeta).metaType === metaType) {
      return (action as ActionMeta).metaData
    }

    action = action.payload

    if (DEV) {
      assertActionExists(action)
    }
  }
}

/**
 * Strips all ActionMeta nodes off an ActionChain and returns the wrapped Action
 */
export const removeAllMeta = (action: ActionChain) => {
  while ((action as ActionMeta).metaType) {
    action = action.payload

    if (DEV) {
      assertActionExists(action)
    }
  }

  return action as Action
}

/**
 * Removes the first found meta node with the given metaType in the given action
 * chain.
 *
 * The metaType does not have to exist in the action chain (though this'll be
 * pretty inefficient and wasteful if it doesn't).
 */
export const removeMeta = (action: ActionChain, metaType: string) => {
  let currentNode = action
  let prevNode = null
  let rootNode = null

  while ((currentNode as ActionMeta).metaType) {
    if ((currentNode as ActionMeta).metaType === metaType) {
      return getNewRoot(currentNode, prevNode, rootNode)
    }

    // Move down the chain
    const clonedNode = { ...currentNode }

    prevNode && (prevNode.payload = clonedNode)

    prevNode = clonedNode
    currentNode = currentNode.payload

    // If this will be the new root, remember it
    rootNode || (rootNode = prevNode)
  }

  // No match found; return the original action chain
  return action
}
