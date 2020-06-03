import { metaTypes } from '@src/api/constants'
import { ActionChain, HierarchyConfig } from '@src/types'
import { invalidDelegation } from '@src/utils/errors'
import { HierarchyType } from '@src/utils/general'
import { getMetaData, removeMeta } from '@src/api/meta'
import { DiffNode } from '@src/utils/types'

/**
  Delegates an action to a child store.

  Does nothing if the special DELEGATE meta node is not present
  in the action meta chain.

  This expects the `metaData` of the DELEGATE meta node to be
  an array containing a path of nodes describing the child store's
  location in the parent store's current hierarchy descriptor.

  Delegated actions will not be handled by the parent store at all.
*/
export const delegate = (diffTree: DiffNode, action: ActionChain) => {
  const subStorePath = getMetaData(action, metaTypes.DELEGATE)

  if (!subStorePath) return false

  const child = findChild(diffTree, subStorePath, invalidDelegation)

  if (child.type !== HierarchyType.Store) {
    throw new TypeError(invalidDelegation(subStorePath))
  }

  return child.store.dispatch(removeMeta(action, metaTypes.DELEGATE))
}

/**
  Finds a node in a diffTree given a node path (array of nodes).
*/
export const findChild = (
  diffTree: DiffNode,
  nodePath: string[],
  getErrorMessage: (nodePath: string[]) => string
) => {
  for (const node of nodePath) {
    if (!diffTree.children) {
      throw new ReferenceError(getErrorMessage(nodePath))
    }

    diffTree = diffTree.children[node]

    if (!diffTree) {
      throw new ReferenceError(getErrorMessage(nodePath))
    }
  }

  return diffTree
}

/**
  Propagates a state change from a child store to a parent.

  Recursively finds the child store's node in the parent store's
  state tree and re-creates all the nodes down that path.

  #immutability
*/
export const propagateChange = <State = any>(
  currentState: State,
  subStorePath: string[],
  newSubStoreState: any,
  hierarchyConfig: HierarchyConfig
): State => {
  if (!subStorePath.length) return newSubStoreState

  // at this point we can assume that currentState is a hierarhical structure
  // these "currentState as any" casts should be fine
  const newNode = hierarchyConfig.clone(currentState as any)
  const nextNodeKey = subStorePath[0]

  return hierarchyConfig.set(
    newNode,
    nextNodeKey,
    propagateChange(
      hierarchyConfig.get(currentState as any, nextNodeKey),
      subStorePath.slice(1),
      newSubStoreState,
      hierarchyConfig
    )
  ) as any
}
