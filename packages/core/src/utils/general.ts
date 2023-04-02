/**
 * These hierarchy node types are essentially an enum
 */
export const BranchNodeType = 1
export const NullNodeType = 2
export const ReducerNodeType = 3
export const StoreNodeType = 4

export type BranchNodeType = typeof BranchNodeType
export type NullNodeType = typeof NullNodeType
export type ReducerNodeType = typeof ReducerNodeType
export type StoreNodeType = typeof StoreNodeType

export const observableSymbol =
  (typeof Symbol === 'function' && (Symbol as any).observable) || '@@observable'

// Used to check if something is a Zedux store
export const STORE_IDENTIFIER = Symbol.for('zedux.store')
