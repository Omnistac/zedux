import { detailedTypeof, noop } from '../utils/general'
import {
  Action,
  ActionChain,
  ActionMeta,
  Effect,
  EffectChain,
  EffectMeta,
} from '../types'

const assertActionExists = DEV
  ? (actionOrEffect: ActionChain | EffectChain) => {
      if (actionOrEffect) return

      throw new Error(
        `Zedux: Invalid meta chain. The last node in the chain must be either a valid action object with a non-empty "type" property or an effect with a non-empty "effectType" property. Received ${detailedTypeof(
          actionOrEffect
        )}`
      )
    }
  : noop

const getNewRoot = <T extends ActionChain | EffectChain>(
  currentNode: T,
  prevNode: T | null,
  rootNode: T | null
): T => {
  // If the match is at the top layer, just return the next layer
  if (!prevNode || !rootNode) return currentNode.payload

  // If the match is at least one layer deep, swap out the target layer
  // and return the new root of the meta chain
  prevNode.payload = currentNode.payload

  return rootNode
}

/**
 * Adds a meta node of the given metaType and with the given
 * metaData at the beginning of an ActionChain/EffectChain
 */
export const addMeta: {
  (action: ActionChain, metaType: string, metaData?: any): ActionMeta
  (effect: EffectChain, metaType: string, metaData?: any): EffectMeta
} = (actionOrEffect: any, metaType: string, metaData?: any) => {
  const wrappedAction: any = {
    metaType,
    payload: actionOrEffect,
  }

  if (metaData) wrappedAction.metaData = metaData

  return wrappedAction
}

/**
 * Returns the value of the metaData field of the first ActionMeta
 * or EffectMeta object in the chain with the given metaType.
 */
export const getMetaData = (
  actionOrEffect: ActionChain | EffectChain,
  metaType: string
) => {
  while ((actionOrEffect as ActionMeta).metaType) {
    if ((actionOrEffect as ActionMeta).metaType === metaType) {
      return (actionOrEffect as ActionMeta).metaData
    }

    actionOrEffect = actionOrEffect.payload

    if (DEV) {
      assertActionExists(actionOrEffect)
    }
  }
}

/**
 * Returns true if the given ActionChain or EffectChain contains
 * an ActionMeta or EffectMeta node with the given metaType.
 */
export const hasMeta = (
  actionOrEffect: ActionChain | EffectChain,
  metaType: string
) => {
  while ((actionOrEffect as ActionMeta).metaType) {
    if ((actionOrEffect as ActionMeta).metaType === metaType) return true

    actionOrEffect = actionOrEffect.payload

    if (DEV) {
      assertActionExists(actionOrEffect)
    }
  }

  return false
}

/**
 * Strips off an ActionChain or EffectChain and returns the wrapped
 * Action or Effect
 */
export const removeAllMeta: {
  (action: ActionChain): Action
  (effect: EffectChain): Effect
} = (actionOrEffect: any) => {
  while (actionOrEffect.metaType) {
    actionOrEffect = actionOrEffect.payload

    if (DEV) {
      assertActionExists(actionOrEffect)
    }
  }

  return actionOrEffect
}

/**
  Removes the first found meta node with the given metaType in
  the given meta chain

  The metaType does not have to exist in the meta chain
  (though this'll be pretty inefficient and wasteful if it doesn't).
*/
export const removeMeta: {
  (action: ActionChain, metaType: string): ActionChain
  (effect: EffectChain, metaType: string): EffectChain
} = (actionOrEffect: any, metaType: string) => {
  let currentNode = actionOrEffect as ActionChain | EffectChain
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

  // No match found; return the original meta chain
  return actionOrEffect
}
