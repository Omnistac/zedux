import { createActor } from '../utils/actor'
import { assertAreFunctions } from '../utils/errors'


/**
  Creates a Zedux state.

  A State is just a fancy actor that contains details about
  how it should be processed - enter and leave hooks.

  A Zedux state is just a state with a few special methods for
  creating the processing hooks.
*/
export function state(...namespaceNodes) {
  let stateName = namespaceNodes.join`/`

  return createState(stateName)
}


/**
  Partially applies state() with one or more namespace nodes.

  This will prefix all actors created with the bound state() function
  with the given namespace (joined by slashes - "/").
*/
state.namespace = function(...namespaceNodes) {
  return state.bind(null, ...namespaceNodes)
}





function createState(stateName) {

  /**
    A Zedux state is an actor whose `type` is the state's name.
  */
  const zeduxState = createActor(stateName)


  /**
    Sets the `enter` processing hook for this state.

    This hook should be called the very next time the store's
    processor layer is hit after the reducer layer makes the
    machine enter this state.
  */
  zeduxState.onEnter = func => {
    assertAreFunctions([ func ], 'ZeduxState.onEnter()')

    zeduxState.enter = func

    return zeduxState // for chaining
  }


  /**
    Sets the `leave` processing hook for this state.

    This hook should be called the very next time the store's
    processor layer is hit after the reducer layer makes the
    machine leave this state.
  */
  zeduxState.onLeave = func => {
    assertAreFunctions([ func ], 'ZeduxState.onLeave()')

    zeduxState.leave = func

    return zeduxState // for chaining
  }


  // Expose the action `type` for this state (a state is an actor).
  // Read only! There should never be any reason to modify this.
  zeduxState.type = stateName


  return zeduxState
}
