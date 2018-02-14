const sharedToStringMethod = function() {
  return this.type
}


export function createActor(actionType) {

  // The default payload creator is the identity function
  let payloadCreator = arg => arg


  // The actor itself just returns a normal action object with the
  // `type` set and the `payload` determined by passing the arguments
  // along to the payload creator.
  const actor = (...args) => {
    let action = {
      type: actor.type
    }

    const payload = payloadCreator(...args)

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


  // Expose the action `type` for this actor.
  // Read only! There should never be any reason to modify this.
  actor.type = actionType


  // For convenience, overwrite the function's .toString() method.
  // Make it return the actor's `type`. Useful for stuff like:
  // { [anActor]: aReducer }
  actor.toString = sharedToStringMethod


  return actor
}


export function createActorCreator(createActorImplementation) {
  return (...namespaceNodes) => {
    const actionType = namespaceNodes.join`/`

    return createActorImplementation(actionType)
  }
}
