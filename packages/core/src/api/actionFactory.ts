import { Action, ActionFactory } from '../types'
import { detailedTypeof } from './detailedTypeof'

/**
  Factory for creating ActionFactory objects.

  ActionFactories are just action creators with an extra `.type` property set to
  the string passed to `actionFactory()`.

  ActionFactories can be passed directly to a ReducerBuilder's `reduce()`
  method, thus removing the necessity of string constants.
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

  // The factory itself just returns a normal action object with the `type` and
  // optional `payload` set.
  const factory = ((payload?: Payload) => {
    const action: Action<Payload, Type> = {
      type: factory.type,
    }

    if (typeof payload !== 'undefined') action.payload = payload

    return action
  }) as ActionFactory<Payload, Type>

  // Expose the action `type` for this factory. Read only! There should never be
  // any reason to modify this.
  factory.type = actionType

  return factory as any
}
