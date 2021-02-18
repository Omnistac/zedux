import { Reactable, MachineStateRepresentation } from '../types'
import { assertIsValidActor, assertIsValidState } from './errors'

/**
  Pulls the string action type out of an actor or returns
  a given string action type as-is.
*/
export const extractActionType = (method: string) => (actor: Reactable) => {
  // The "actor" may be a literal action type string
  if (typeof actor === 'string') return actor

  assertIsValidActor(actor, method)

  return actor.type
}

/**
  Pulls the string action types out of a list of (possibly) mixed
  actors and string action types.
*/
export const extractActionTypes = (actors: Reactable[], method: string) =>
  actors.map(extractActionType(method))

export const extractStateType = (state: MachineStateRepresentation) => {
  if (typeof state === 'string') return state

  assertIsValidState(state)

  return state.type
}
