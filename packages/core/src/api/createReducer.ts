import { Action, Reactable, SubReducer, ZeduxReducer } from '../types'
import { extractActionType, extractActionTypes } from '../utils/actor'

interface ReducersMap<State> {
  [key: string]: SubReducer<State>[]
}

/**
  Creates a new Zedux reducer.

  A Zedux reducer is just a reducer with a few special methods for
  easily mapping action types to sub-reducers that handle them.
*/
export const createReducer = <State = any>(initialState?: State) => {
  const actionToReducersMap: ReducersMap<State> = {}

  const reducer = ((state: State = initialState as State, action: Action) => {
    const reducers = actionToReducersMap[action.type] || []

    return runReducers(reducers, state, action)
  }) as ZeduxReducer<State>

  reducer.reduce = <Payload = any, Type extends string = string>(
    actor: Reactable<Payload, Type> | Reactable<Payload, Type>[],
    subReducer: SubReducer<State>
  ) => {
    const method = 'ZeduxReducer.reduce()'
    const actionTypes = Array.isArray(actor)
      ? extractActionTypes(actor, method)
      : [extractActionType(method)(actor)]

    mapActionTypesToReducer(actionToReducersMap, actionTypes, subReducer)

    return reducer
  }

  return reducer
}

function mapActionTypesToReducer<State>(
  map: ReducersMap<State>,
  actionTypes: string[],
  consumer: SubReducer
) {
  actionTypes.forEach(actionType => {
    if (!map[actionType]) {
      map[actionType] = []
    }

    map[actionType].push(consumer)
  })
}

function runReducers<State>(
  reducers: SubReducer[],
  state: State,
  action: Action
) {
  return reducers.reduce(
    (accumulatedState, reducer) => reducer(accumulatedState, action.payload),
    state
  )
}
