import { Action, ActionFactory } from '../types'
import { detailedTypeof } from '../utils/general'

/**
  Factory for creating ActionFactory objects.

  Actors are like action creators with a little extra functionality.

  They can be passed directly to a ZeduxReducer's `reduce()` method, thus
  removing the necessity of string constants.
*/
export const actionFactory: <Payload = undefined, Type extends string = string>(
  actionType: Type
) => Payload extends undefined
  ? ActionFactory<undefined, Type>
  : ActionFactory<Payload, Type> = <Payload, Type extends string>(
  actionType: Type
) => {
  if (DEV && typeof actionType !== 'string') {
    throw new TypeError(
      `Zedux: actionFactory() - actionType must be a string. Received ${detailedTypeof(
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
  }) as ActionFactory<Payload, Type>

  // Expose the action `type` for this actor.
  // Read only! There should never be any reason to modify this.
  actor.type = actionType

  return actor as any
}
