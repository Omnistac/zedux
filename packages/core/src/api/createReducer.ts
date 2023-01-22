import { Action, Reactable, ReducerBuilder, SubReducer } from '../types'
import { extractActionType, extractActionTypes } from '../utils/actions'

interface ReducersMap<State> {
  [key: string]: SubReducer<State>[]
}

/**
  Creates a new ReducerBuilder.

  A ReducerBuilder is just a reducer with a special `.reducer()` method for
  easily mapping action types to sub-reducers that handle them.
*/
export const createReducer = <State = any>(initialState?: State) => {
  const actionToReducersMap: ReducersMap<State> = {}

  const reducer = ((state: State = initialState as State, action: Action) => {
    const reducers = actionToReducersMap[action.type] || []

    return runReducers(reducers, state, action)
  }) as ReducerBuilder<State>

  reducer.reduce = <Payload = any, Type extends string = any, Meta = any>(
    reactable: Reactable<Payload, Type> | Reactable<Payload, Type>[],
    subReducer: SubReducer<State, Payload, Type, Meta>
  ) => {
    const method = 'ReducerBuilder.reduce()'
    const actionTypes = Array.isArray(reactable)
      ? extractActionTypes(reactable, method)
      : [extractActionType(reactable, method)]

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
    (accumulatedState, reducer) =>
      reducer(accumulatedState, action.payload, action),
    state
  )
}
