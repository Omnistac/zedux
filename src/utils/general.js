import { assertIsValidActor } from './errors'


export const ARRAY = 'array'
export const COMPLEX_OBJECT = 'complex object'
export const NO_PROTOTYPE = 'prototype-less object'
export const NULL = 'null'
export const PLAIN_OBJECT = 'object'


// Create a unique symbol in the global symbol registry
// to identify zedux stores
export const STORE_IDENTIFIER = Symbol.for('zedux.store')


/**
  Returns a more informative description of thing's type.

  Used to give users helpful error messages that detail exactly why
  their input was rejected, rather than ux nightmares like:

  "expected a plain object, received object"
*/
export function detailedTypeof(thing) {
  let thingType = typeof thing

  if (thingType !== 'object') return thingType
  if (!thing) return NULL
  if (Array.isArray(thing)) return ARRAY

  return getDetailedObjectType(thing)
}


/**
  Pulls the string action type out of an actor or returns
  a given string action type as-is.
*/
export function extractActionType(actor, method) {

  // The "actor" may be a literal action type string
  if (typeof actor === 'string') return actor

  assertIsValidActor(actor, method)

  return actor.type
}


/**
  Pulls the string action types out of a list of (possibly) mixed
  actors and string action types.
*/
export function extractActionTypes(actors, method) {
  return actors.map(extractActionType, method)
}


/**
  Checks whether thing is a plain old object.

  The object may originate from another realm or have its prototype
  explicitly set to Object.prototype, but it may not have a null
  prototype or prototype chain more than 1 layer deep.
*/
export function isPlainObject(thing) {
  if (typeof thing !== 'object' || !thing) return false

  let prototype = Object.getPrototypeOf(thing)
  if (!prototype) return false // it was created with Object.create(null)

  // If the prototype chain is exactly 1 layer deep, it's a normal object
  return Object.getPrototypeOf(prototype) === null
}


/**
  Checks whether thing is a Zedux store.

  All Zedux stores have a special symbol as their `$$typeof` property.
*/
export function isZeduxStore(thing) {
  return thing.$$typeof === STORE_IDENTIFIER
}





/**
  Determines which kind of object an "object" is.

  Objects can be prototype-less, complex, or plain.
*/
function getDetailedObjectType(thing) {
  let prototype = Object.getPrototypeOf(thing)

  if (!prototype) return NO_PROTOTYPE

  return Object.getPrototypeOf(prototype)
    ? COMPLEX_OBJECT
    : PLAIN_OBJECT
}
