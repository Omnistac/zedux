import { Action, MachineState, Reducer } from '../types'
import { assertIsValidState } from '../utils/errors'

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
  ...states: MachineState<State>[]
) => {
  if (!states.length) {
    throw new Error(
      'Zedux Error - createMachine() - At least one state is required'
    )
  }

  // can maybe add stricter types around the initialState
  const initialStateName = states[0].type

  // tracks directed edges between states
  const stateTransitionMap: StateTransitionMap<State> = {}

  states.forEach(state => {
    assertIsValidState(state)
    ;(stateTransitionMap as any)[state.type] = state.transitions
  })

  /**
    The reducer.

    Determines if the given action is a valid transition from the current state.
  */
  const reducer: Reducer<State> = (
    state = initialStateName,
    action: Action
  ) => {
    const actionType = action.type
    const possibleNextStates = stateTransitionMap[state]

    return (possibleNextStates && possibleNextStates[actionType]) || state
  }

  return reducer
}
