import { Action, Reactable, ZeduxMachine } from '../types'
import { extractActionType } from '../utils/actor'

interface StateTransitionMap<State> {
  [key: string]: {
    [key: string]: State
  }
}

/**
  Creates a Zedux machine.

  A Zedux machine is just a reducer with a few special methods for
  defining how the machine transitions from one state to the next.
*/
export const createMachine = <State extends string = string>(
  initialState?: Reactable
) => {
  const method = `createMachine()`

  // can maybe add stricter types around the initialState
  const initialStateName = initialState
    ? (extractActionType(method)(initialState) as State)
    : undefined

  // tracks directed edges between states
  const stateTransitionMap: StateTransitionMap<State> = {}

  /**
    The reducer.

    Determines if the given action is a valid transition from the current state.
  */
  const reducer: ZeduxMachine<State> = (
    state = initialStateName,
    action: Action
  ) => {
    const actionType = action.type
    const possibleNextStates = stateTransitionMap[state]

    if (!possibleNextStates) {
      return state // short-circuit in most common case
    }

    return (possibleNextStates && possibleNextStates[actionType]) || state
  }

  /**
    Draws a directed edge from one state to another with an optional transition
    action name.

    If 2 arguments are given, the transition name (action `type`) is assumed
    to be the name of the second state.
  */
  reducer.addTransition = (
    fromState: Reactable,
    transitionAction: Reactable,
    toState?: Reactable
  ) => {
    const currentMethod = 'ZeduxMachine.addTransition()'
    const extract = extractActionType(currentMethod)

    const fromActionType = extract(fromState)
    const transitionType = extract(transitionAction)
    const toActionType = toState ? extract(toState) : transitionType

    if (!stateTransitionMap[fromActionType]) {
      stateTransitionMap[fromActionType] = {}
    }

    stateTransitionMap[fromActionType][transitionType] = toActionType as State

    return reducer // for chaining
  }

  /**
    Draws undirected "edges" between all the given states; each given state
    will be able to transition back and forth between all the other given
    states.

    Doesn't accept any transition names. To get from state `a` to state `b`,
    an action must be dispatched like:

      { type: 'b' }
  */
  reducer.addUndirectedTransitions = (...states: Reactable[]) => {
    if (states.length < 2) return reducer // for chaining

    states.forEach(fromState => {
      states.forEach(toState => {
        if (fromState === toState) return

        reducer.addTransition(fromState, toState)
      })
    })

    return reducer // for chaining
  }

  return reducer
}
