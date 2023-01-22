import { Reactable } from '../types'

/**
  Pulls the string action type out of an ActionFactory or returns
  a given string action type as-is.
*/
export const extractActionType = (reactable: Reactable, method: string) => {
  // The reactable may be a literal action type string
  if (typeof reactable === 'string') return reactable

  if (
    DEV &&
    (typeof reactable !== 'function' || typeof reactable.type !== 'string')
  ) {
    const type =
      typeof reactable === 'function'
        ? `function with invalid "type" property - ${typeof reactable.type}`
        : typeof reactable

    throw new TypeError(
      `Zedux: ${method} - reactable must be either a string or a function with a "type" property. Received ${type}`
    )
  }

  return reactable.type
}

/**
  Pulls the string action types out of a list of (possibly) mixed
  reactables and string action types.
*/
export const extractActionTypes = (reactables: Reactable[], method: string) =>
  reactables.map(reactable => extractActionType(reactable, method))
