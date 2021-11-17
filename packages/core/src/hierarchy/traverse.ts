import { metaTypes } from '../api/constants'
import { ActionChain, HierarchyConfig } from '../types'
import { DEV, HierarchyType } from '../utils/general'
import { getMetaData, removeMeta } from '../api/meta'
import { DiffNode, StoreNode } from '../utils/types'

export const getErrorMessage = DEV
  ? (subStorePath: string[]) =>
      `Zedux: store.dispatch() - Invalid Delegation - Current store hierarchy does not contain a sub-store at path: ${subStorePath.join(
        ' -> '
      )}`
  : () => ''

/**
  Finds a node in a diffTree given a node path (array of nodes).
*/
const findChild = (diffTree: DiffNode, nodePath: string[]) => {
  for (const node of nodePath) {
    if (diffTree.type !== HierarchyType.Branch) {
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
  Delegates an action to a child store.

  Does nothing if the special DELEGATE meta node is not present
  in the action meta chain.

  This expects the `metaData` of the DELEGATE meta node to be
  an array containing a path of nodes describing the child store's
  location in the parent store's current hierarchy descriptor.

  Delegated actions will not be handled by the parent store at all.
*/
export const delegate = (
  diffTree: DiffNode | undefined,
  action: ActionChain
) => {
  const subStorePath = getMetaData(action, metaTypes.DELEGATE)

  if (!subStorePath || !diffTree) return false

  const child = findChild(diffTree, subStorePath)

  if (child.type !== HierarchyType.Store) {
    throw new TypeError(getErrorMessage(subStorePath))
  }

  return (child as StoreNode).store.dispatch(
    removeMeta(action, metaTypes.DELEGATE)
  )
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
