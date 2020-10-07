import { Action, ZeduxActor } from '../types'
import { detailedTypeof } from '../utils/general'

const sharedToStringMethod = function() {
  return this.type
}

/**
  Factory for creating ZeduxActor objects.

  Actors are like action creators with a little extra functionality.

  They can be passed directly to a ZeduxReducer's `reduce()` method, thus
  removing the necessity of string constants.
*/
export const createActor = <Payload = undefined>(actionType: string) => {
  if (typeof actionType !== 'string') {
    throw new TypeError(
      `Zedux Error - createActor() - actionType must be a string. Received ${detailedTypeof(
        actionType
      )}`
    )
  }

  // The actor itself just returns a normal action object with the
  // `type` and optional `payload` set.
  const actor: ZeduxActor<Payload> = (payload?: Payload) => {
    const action: Action<Payload> = {
      type: actor.type,
    }

    if (typeof payload !== 'undefined') action.payload = payload

    return action
  }

  // For convenience, overwrite the function's .toString() method.
  // Make it return the actor's `type`. Useful for stuff like:
  // { [anActor]: aReducer }
  actor.toString = sharedToStringMethod

  // Expose the action `type` for this actor.
  // Read only! There should never be any reason to modify this.
  actor.type = actionType

  return actor
}
