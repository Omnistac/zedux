import { assertIsValidActor } from '../utils/errors'
import { slice } from '../utils/general'
import { processableToPromise } from '../utils/processable'


const GLOBAL_ACTION_TYPE = '*'


/**
  Creates a new Zedux reactor.

  A Zedux reactor is just a reactor with a few special methods for
  easily mapping action types to sub-reducers that handle them.
*/
export function react(initialState) {
  const actionToProcessorsMap = {}
  const actionToReducersMap = {}
  let currentActionTypes = []


  const reactor = (state = initialState, action) =>
    handleReactorLayer(actionToReducersMap, runReducers, state, action)


  reactor.process = (a, b, c) => {
    handleReactorLayer(actionToProcessorsMap, runProcessors, a, b, c)
  }


  reactor.to = function() {
    currentActionTypes = extractActionTypes(slice.call(arguments))

    return reactor // for chaining
  }


  reactor.toEverything = () => {
    currentActionTypes = [ GLOBAL_ACTION_TYPE ]

    return reactor // for chaining
  }


  reactor.withProcessors = function() {
    mapActionTypesToConsumers(
      actionToProcessorsMap,
      currentActionTypes,
      arguments
    )

    return reactor // for chaining
  }


  reactor.withReducers = function() {
    mapActionTypesToConsumers(
      actionToReducersMap,
      currentActionTypes,
      arguments
    )

    return reactor // for chaining
  }


  return reactor
}





function extractActionTypes(actors) {
  return actors.map(actor => {

    // The "actor" may be a literal action type string
    if (typeof actor === 'string') return actor

    assertIsValidActor(actor)

    return actor.type
  })
}


function handleReactorLayer(map, callback, a, action, b) {
  const actionType = action.type

  const reducers = [
    ...map[actionType] || [],
    ...map[GLOBAL_ACTION_TYPE] || []
  ]

  return callback.apply(null, [ reducers, a, action, b ])
}


function mapActionTypesToConsumers(map, actionTypes, consumers) {
  actionTypes.forEach(actionType => {
    for (let i = 0; i < consumers.length; i++) {

      if (!map[actionType]) {
        map[actionType] = []
      }

      map[actionType].push(consumers[i])
    }
  })
}


function runProcessors(processors, dispatch, action, state) {
  processors.forEach(processor => {
    const processable = processor(dispatch, action, state)

    processableToPromise(processable)
  })
}


function runReducers(reducers, state, action) {
  return reducers.reduce(
    (accumulatedState, reducer) => reducer(accumulatedState, action), state
  )
}
