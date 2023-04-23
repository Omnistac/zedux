import { getMetaData, removeMeta } from '../api/meta'
import { zeduxTypes } from '../api/zeduxTypes'
import { ActionChain, HierarchyConfig } from '../types'
import { BranchNodeType, StoreNodeType } from '../utils/general'
import { HierarchyNode, StoreNode } from '../utils/types'

const getErrorMessage = (subStorePath: string[]) =>
  `Zedux: store.dispatch() - Invalid Delegation - Store does not contain a child store at path: ${subStorePath.join(
    ' -> '
  )}`

const prodError = 'Minified Error'

/**
 * Finds a node in a tree given a node path (array of nodes).
 */
const findChild = (tree: HierarchyNode, nodePath: string[]) => {
  for (const node of nodePath) {
    if (tree.type !== BranchNodeType) {
      throw new ReferenceError(DEV ? getErrorMessage(nodePath) : prodError)
    }

    tree = tree.children[node]

    if (!tree) {
      throw new ReferenceError(DEV ? getErrorMessage(nodePath) : prodError)
    }
  }

  return tree
}

/**
 * Delegates an action to a child store.
 *
 * Does nothing if the special `delegate` meta node is not present in the action
 * chain.
 *
 * This expects the `metaData` of the `delegate` meta node to be an array
 * containing a path of nodes describing the child store's location in the
 * parent store's current hierarchy descriptor.
 *
 * Delegated actions will not be handled by the parent store at all.
 */
export const delegate = (
  tree: HierarchyNode | undefined,
  action: ActionChain
) => {
  const subStorePath = getMetaData(action, zeduxTypes.delegate)

  if (!subStorePath || !tree) return false

  const child = findChild(tree, subStorePath)

  if (child.type !== StoreNodeType) {
    throw new TypeError(DEV ? getErrorMessage(subStorePath) : prodError)
  }

  ;(child as StoreNode).store.dispatch(removeMeta(action, zeduxTypes.delegate))
}

/**
 * Propagates a state change from a child store to a parent.
 *
 * Recursively finds the child store's node in the parent store's state tree and
 * re-creates all the nodes down that path.
 *
 * #immutability
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
