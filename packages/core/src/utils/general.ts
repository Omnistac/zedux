export const ARRAY = 'array'
export const COMPLEX_OBJECT = 'complex object'
export const NO_PROTOTYPE = 'prototype-less object'
export const NULL = 'null'
export const PLAIN_OBJECT = 'object'

export enum HierarchyType {
  Branch,
  Null,
  Reducer,
  Store,
}

export const observableSymbol =
  (typeof Symbol === 'function' && (Symbol as any).observable) || '@@observable'

// Identifies Zedux subscribers - used when Zedux subscribes
// to a child store from a parent store
export const INTERNAL_SUBSCRIBER_ID = Symbol.for('zedux.subscriber')

// Used to check if something is a Zedux store
export const STORE_IDENTIFIER = Symbol.for('zedux.store')

/**
  Returns a more informative description of value's type.

  Used to give users helpful error messages that detail exactly why
  their input was rejected, rather than ux nightmares like:

  "expected a plain object, received object"
*/
export function detailedTypeof(value: any) {
  const valueType = typeof value

  if (valueType !== 'object') return valueType
  if (!value) return NULL
  if (Array.isArray(value)) return ARRAY

  return getDetailedObjectType(value)
}

/**
  Checks whether value is a plain old object.

  The object may originate from another realm or have its prototype
  explicitly set to Object.prototype, but it may not have a null
  prototype or prototype chain more than 1 layer deep.
*/
export function isPlainObject(value: any) {
  if (typeof value !== 'object' || !value) return false

  const prototype = Object.getPrototypeOf(value)
  if (!prototype) return false // it was created with Object.create(null)

  // If the prototype chain is exactly 1 layer deep, it's likely a normal object
  return Object.getPrototypeOf(prototype) === null
}

/**
  Checks whether value is a Zedux store.

  All Zedux stores have a special symbol as their `$$typeof` property.
*/
export function isZeduxStore(value: any) {
  return value?.constructor?.$$typeof === STORE_IDENTIFIER
}

/**
  Determines which kind of object an "object" is.

  Objects can be prototype-less, complex, or plain.
*/
function getDetailedObjectType(value: any) {
  const prototype = Object.getPrototypeOf(value)

  if (!prototype) return NO_PROTOTYPE

  return Object.getPrototypeOf(prototype) ? COMPLEX_OBJECT : PLAIN_OBJECT
}
