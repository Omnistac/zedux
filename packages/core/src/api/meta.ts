import { detailedTypeof, noop } from '../utils/general'
import { Action, ActionChain, ActionMeta } from '../types'

const assertActionExists = DEV
  ? (action: ActionChain) => {
      if (action) return

      throw new Error(
        `Zedux: Invalid action chain. The last node in the chain must be either a valid action object with a non-empty "type" property or an effect with a non-empty "effectType" property. Received ${detailedTypeof(
          action
        )}`
      )
    }
  : noop

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
 * Adds a meta node of the given metaType and with the given metaData at the
 * beginning of an ActionChain
 */
export const addMeta = (
  action: ActionChain,
  metaType: string,
  metaData?: any
): ActionMeta => ({
  metaType,
  metaData,
  payload: action,
})

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
 * Returns true if the given ActionChain contains an ActionMeta node with the
 * given metaType.
 */
export const hasMeta = (action: ActionChain, metaType: string) => {
  while ((action as ActionMeta).metaType) {
    if ((action as ActionMeta).metaType === metaType) return true

    action = action.payload

    if (DEV) {
      assertActionExists(action)
    }
  }

  return false
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
