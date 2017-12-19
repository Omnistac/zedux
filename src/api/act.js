import { slice } from '../utils/general'


const identityFunction = arg => arg


/**
  Factory for creating ZeduxActors.

  Actors are like action creators with a little extra functionality.

  They can be passed directly to a reactor's `to*()` methods, thus
  removing the necessity of string constants.

  They also have an error() method that'll create basic action objects
  with the actor's action type and `error: false`.
*/
export function act() {
  let actionType = slice.call(arguments).join`/`

  return createActor(actionType)
}


/**
  Partially applies act() with one or more namespace nodes.

  This will prefix all actors created with the bound act() function
  with the given namespace (joined by slashes - "/").
*/
act.namespace = function() {
  return act.bind.apply(act, [ null ].concat(slice.call(arguments)))
}





function createActor(type) {

  // The default payload creator is the identity function
  let payloadCreator = identityFunction


  // The actor itself just returns a normal action object with the
  // `type` set and the `payload` determined by passing the arguments
  // along to the payload creator.
  const actor = function() {
    let action = {
      type: actor.type
    }

    const payload = payloadCreator.apply(null, arguments)

    if (typeof payload !== 'undefined') action.payload = payload

    return action
  }


  // actor.error() accepts a single argument.
  // That argument should be an instance of Error (not required).
  // It'll return a normal action whose `payload` is the passed argument.
  // It'll also set `error` to true
  actor.error = payload => {
    const action = {
      type: actor.type,
      error: true
    }

    if (typeof payload !== 'undefined') action.payload = payload

    return action
  }


  // actor.payload() - overwrite the default payload creator.
  // Shouldn't be used much, and should never be used more than once
  // for any given actor, as it is mutating.
  actor.payload = newPayloadCreator => {
    payloadCreator = newPayloadCreator

    return actor // for chaining
  }


  // expose the action `type` for this actor.
  // Read only! There should never be any reason to modify this.
  actor.type = type


  return actor
}
