import { extractActionTypes } from '../utils/general'
import { processableToPromise } from '../utils/processable'


const GLOBAL_ACTION_TYPE = '*'


/**
  Creates a new Zedux reactor.

  A Zedux reactor is just a reactor with a few special methods for
  easily mapping action types to sub-reducers and sub-effectors
  that handle them.
*/
export function react(initialState) {
  const actionToEffectorsMap = {}
  const actionToReducersMap = {}
  let currentActionTypes = []


  const reactor = (state = initialState, action) =>
    handleReactorLayer(actionToReducersMap, runReducers, state, action)


  reactor.effects = (...args) =>
    handleReactorLayer(actionToEffectorsMap, runEffectors, ...args)


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
      actionToEffectorsMap,
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

  const runners = [
    ...map[actionType] || [],
    ...map[GLOBAL_ACTION_TYPE] || []
  ]

  return callback(runners, ...args)
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


function runEffectors(effectors, state, action) {
  return effectors.reduce((effects, effector) => {
    const processable = effector(state, action)

    // TODO: What all can a ZeduxReactor sub-effector return?
    processableToPromise(processable)
  }, [])
}


function runReducers(reducers, state, action) {
  return reducers.reduce(
    (accumulatedState, reducer) => reducer(accumulatedState, action), state
  )
}
