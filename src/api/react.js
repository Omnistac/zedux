import { extractActionTypes } from '../utils/general'
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


  reactor.process = (...args) => {
    handleReactorLayer(actionToProcessorsMap, runProcessors, ...args)
  }


  reactor.to = (...actors) => {
    currentActionTypes = extractActionTypes(actors, 'ZeduxReactor.to()')

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





function handleReactorLayer(map, callback, ...args) {
  const actionType = args[1].type

  const reducers = [
    ...map[actionType] || [],
    ...map[GLOBAL_ACTION_TYPE] || []
  ]

  return callback(reducers, ...args)
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
