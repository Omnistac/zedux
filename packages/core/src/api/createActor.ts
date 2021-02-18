import { Action, ZeduxActor, ZeduxActorEmpty } from '../types'
import { detailedTypeof } from '../utils/general'

function sharedToStringMethod() {
  return this.type as string
}

/**
  Factory for creating ZeduxActor objects.

  Actors are like action creators with a little extra functionality.

  They can be passed directly to a ZeduxReducer's `reduce()` method, thus
  removing the necessity of string constants.
*/
export const createActor: <Payload = undefined, Type extends string = string>(
  actionType: Type
) => Payload extends undefined
  ? ZeduxActorEmpty<Type>
  : ZeduxActor<Payload, Type> = <Payload, Type extends string>(
  actionType: Type
) => {
  if (typeof actionType !== 'string') {
    throw new TypeError(
      `Zedux Error - createActor() - actionType must be a string. Received ${detailedTypeof(
        actionType
      )}`
    )
  }

  // The actor itself just returns a normal action object with the
  // `type` and optional `payload` set.
  const actor = ((payload?: Payload) => {
    const action: Action<Payload, Type> = {
      type: actor.type,
    }

    if (typeof payload !== 'undefined') action.payload = payload

    return action
  }) as ZeduxActor<Payload, Type> | ZeduxActorEmpty<Type>

  // For convenience, overwrite the function's .toString() method.
  // Make it return the actor's `type`. Useful for stuff like:
  // { [anActor]: aReducer }
  actor.toString = sharedToStringMethod as any

  // Expose the action `type` for this actor.
  // Read only! There should never be any reason to modify this.
  actor.type = actionType

  return actor as any
}
