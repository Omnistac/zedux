import { isPlainObject } from '../api/isPlainObject'

interface T {
  [key: string]: any
}

/**
  The default method for cloning state tree nodes

  This does not have to create a deep copy.
  In fact, it probably shouldn't.
*/
export const clone = (node: T) => ({ ...node })

/**
  The default method for creating state tree nodes

  Should return an empty node.
*/
export const create = () => ({})

/**
  The default method for retrieving the value of a property on
  the state tree.
*/
export const get = (node: T, key: string) => node[key]

/**
  The default method for determining if something is a state tree node
*/
export const isNode = isPlainObject

/**
  The default method for iterating over the properties of a state tree
  node.

  Should call `callback` with each key-value pair.
*/
export const iterate = (
  node: T,
  callback: (key: string, value: any) => any
) => {
  Object.entries(node).forEach(([key, val]) => callback(key, val))
}

/**
  The default method for setting the value of a property on the
  state tree.

  This can be mutating.
  Zedux promises to never abuse this power.
*/
export const set = (node: T, key: string, val: any) => {
  node[key] = val

  return node
}

/**
  The default method for finding the size of a state tree node.
*/
export const size = (node: T) => Object.keys(node).length
