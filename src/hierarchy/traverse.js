import { metaTypes } from '../api/constants'
import { STORE } from './general'
import { invalidDelegation } from '../utils/errors'
import { getMetaPayload, removeMeta } from '../utils/meta'


/**
  Delegates an action to a child store.

  Does nothing if the special DELEGATE meta node is not present
  in the action meta chain.

  This expects the `metaPayload` of the DELEGATE meta node to be
  an array containing a path of nodes describing the child store's
  location in the parent store's current hierarchy descriptor.

  Delegated actions will not be handled by the parent store at all.
*/
export function delegate(diffTree, action) {
  const subStorePath = getMetaPayload(action, metaTypes.DELEGATE)

  if (!subStorePath) return false

  for (let i = 0; i < subStorePath.length; i++) {
    if (!diffTree.children) {
      throw new ReferenceError(invalidDelegation(subStorePath))
    }

    const node = subStorePath[i]
    diffTree = diffTree.children[node]

    if (!diffTree) {
      throw new ReferenceError(invalidDelegation(subStorePath))
    }
  }

  if (diffTree.type !== STORE) {
    throw new TypeError(invalidDelegation(subStorePath))
  }

  diffTree.store.dispatch(removeMeta(action, metaTypes.DELEGATE))

  return true
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
