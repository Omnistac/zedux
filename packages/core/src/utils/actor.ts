import { Reactable, MachineStateRepresentation } from '../types'
import { assertIsValidState } from './errors'
import { DEV } from './general'

/**
  Pulls the string action type out of an actor or returns
  a given string action type as-is.
*/
export const extractActionType = (actor: any, method: string) => {
  // The "actor" may be a literal action type string
  if (typeof actor === 'string') return actor

  if (DEV && (typeof actor !== 'function' || typeof actor.type !== 'string')) {
    const type =
      typeof actor === 'function'
        ? `function with invalid "type" property - ${typeof actor.type}`
        : typeof actor

    throw new TypeError(
      `Zedux: ${method} - Actor must be either a string or a function with a "type" property. Received ${type}`
    )
  }

  return actor.type
}

/**
  Pulls the string action types out of a list of (possibly) mixed
  actors and string action types.
*/
export const extractActionTypes = (actors: Reactable[], method: string) =>
  actors.map(actor => extractActionType(actor, method))

export const extractStateType = (state: MachineStateRepresentation) => {
  if (typeof state === 'string') return state

  if (DEV) {
    assertIsValidState(state)
  }

  return state.type
}
