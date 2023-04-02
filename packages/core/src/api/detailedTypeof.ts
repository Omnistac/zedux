/**
 * Determines which kind of object an "object" is.
 *
 * Objects can be prototype-less, complex, or plain.
 */
function getDetailedObjectType(value: object) {
  const prototype = Object.getPrototypeOf(value)

  if (!prototype) return 'prototype-less object'

  return Object.getPrototypeOf(prototype) ? 'complex object' : 'object'
}

/**
 * Returns a more informative description of the passed value's type.
 *
 * Used to give users helpful error messages that detail exactly why their input
 * was rejected, rather than ux nightmares like:
 *
 * "expected a plain object, received object"
 */
export function detailedTypeof(value: any) {
  const valueType = typeof value

  if (valueType !== 'object') return valueType
  if (!value) return 'null'
  if (Array.isArray(value)) return 'array'

  return getDetailedObjectType(value)
}
