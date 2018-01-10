import { isPlainObject } from './general'


/**
  The default method for cloning state tree nodes

  This does not have to create a deep copy.
  In fact, it probably shouldn't.
*/
export const clone = node => ({ ...node })


/**
  The default method for creating state tree nodes

  Should return an empty node.
*/
export const create = () => ({})


/**
  The default method for retrieving the value of a property on
  the state tree.
*/
export const get = (node, key) => node[key]


/**
  The default method for determining if something is a state tree node
*/
export const isNode = isPlainObject


/**
  The default method for iterating over the properties of a state tree
  node.

  Should call `callback` with each key-value pair.
*/
export const iterate = (node, callback) => {
  Object.entries(node).forEach(([ key, val ]) => callback(key, val))
}


/**
  The default method for setting the value of a property on the
  state tree.

  This can be mutating.
  Zedux promises to never abuse this power.
*/
export const set = (node, key, val) => {
  node[key] = val

  return node
}
