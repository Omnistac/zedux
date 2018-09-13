import { extractActionType, extractActionTypes } from '../utils/actor'
import { processableToPromise } from '../utils/processable'


/**
  Creates a Zedux machine.

  A Zedux machine is just a reactor with a few special methods for
  defining how the machine transitions from one state to the next.
*/
export function transition(initialState) {
  const method = `${transition.name}()`
  const initialStateName = extractActionType(initialState, method)

  const stateMap = {} // used for easy lookup of a state's data given its name
  const stateTransitionMap = {} // tracks directed edges between states
  let currentStates = [ initialStateName ]
  let currentState


  // Register the initial state.
  registerState(stateMap, initialState, method)


  /**
    The reducer.

    Determines if the given action is a valid state in this machine and
    whether that state is reachable from the current state.
  */
  const reactor = (state = initialStateName, action) => {
    const actionType = action.type

    if (!stateMap[actionType]) {
      return state // short-circuit in most common case
    }

    const possibleNextStates = stateTransitionMap[state]

    return possibleNextStates.includes(actionType)
      ? actionType
      : state // can't transition to the given state right now
  }


  /**
    The effects creator.

    Runs any `enter` or `leave` hooks triggered by the reducer's
    state updates.
  */
  reactor.effects = (state, action) => {
    if (state === currentState) return

    const oldStateDefinition = stateMap[currentState]
    const newStateDefinition = stateMap[state]

    currentState = state

    if (oldStateDefinition && oldStateDefinition.leave) {
      const processable = oldStateDefinition.leave(state, action)

      processableToPromise(processable)
    }

    if (newStateDefinition.enter) {
      const processable = newStateDefinition.enter(state, action)

      processableToPromise(processable)
    }
  }


  /**
    Sets the list of states from which we're transitioning.

    Combined with reactor.to(), this creates a directed edge between
    the given states ("nodes") - an edge going "from" these states "to"
    those states.
  */
  reactor.from = (...states) => {
    // We don't need to register these states as they're technically
    // unreachable if they only appear here. Register them in .to()

    currentStates = extractActionTypes(states)

    return reactor // for chaining
  }


  /**
    Sets the list of states to which we're transitioning.

    When it's done, also sets this list as the current "from" states.

    Combined with reactor.from(), this creates a directed edge between
    the given states ("nodes") - an edge going "from" those states "to"
    these states.
  */
  reactor.to = (...states) => {
    registerStates(stateMap, states, 'ZeduxMachine.to()')

    const stateNames = extractActionTypes(states)

    mapStateTransitions(
      stateTransitionMap,
      currentStates,
      stateNames
    )

    // Set these states as the new "from" states. This allows the shorthand:
    // transition(a)
    //   .to(b, c)
    //   .to(d, e)
    currentStates = stateNames

    return reactor // for chaining
  }


  /**
    Draws undirected "edges" between all the given states; each given state
    will be able to transition back and forth between all the other given
    states.
  */
  reactor.undirected = (...states) => {
    reactor.from(...states)
      .to(...states)

    return reactor // for chaining
  }


  return reactor
}





function mapStateTransitions(map, fromStates, toStates) {
  for (let i = 0; i < fromStates.length; i++) {
    const fromState = fromStates[i]

    if (!map[fromState]) {
      map[fromState] = toStates

      continue
    }

    map[fromState] = [
      ...map[fromState],
      ...toStates
    ]
  }
}


function registerState(map, state, method) {
  const stateName = extractActionType(state, method)

  if (map[stateName]) return

  map[stateName] = state
}


function registerStates(map, states, method) {
  states.forEach(state => registerState(map, state, method))
}
