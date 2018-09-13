import { createActor, createActorCreator } from '../utils/actor'
import { assertAreFunctions } from '../utils/errors'


/**
  Creates a Zedux state.

  A State is just a fancy actor that contains details about
  how it creates side effects.

  A Zedux state is just a state with a few special methods for
  creating the enter and leave hooks.
*/
export const state = createActorCreator(createState)


/**
  Partially applies state() with one or more namespace nodes.

  This will prefix all states created with the bound state() function
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
    Sets the `enter` side effect hook for this state.

    This hook should be called the very next time the store's
    side effects layer is hit after the reducer layer makes the
    machine enter this state.
  */
  zeduxState.onEnter = func => {
    assertAreFunctions([ func ], 'ZeduxState.onEnter()')

    zeduxState.enter = func

    return zeduxState // for chaining
  }


  /**
    Sets the `leave` side effect hook for this state.

    This hook should be called the very next time the store's
    side effects layer is hit after the reducer layer makes the
    machine leave this state.
  */
  zeduxState.onLeave = func => {
    assertAreFunctions([ func ], 'ZeduxState.onLeave()')

    zeduxState.leave = func

    return zeduxState // for chaining
  }


  return zeduxState
}
