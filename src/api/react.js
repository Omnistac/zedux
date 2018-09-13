import { extractActionTypes } from '../utils/actor'
import { processableToPromise } from '../utils/processable'


const GLOBAL_ACTION_TYPE = '*'


/**
  Creates a new Zedux reactor.

  A Zedux reactor is just a reactor with a few special methods for
  easily mapping action types to sub-reducers and sub-effectCreators
  that handle them.
*/
export function react(initialState) {
  const actionToEffectCreatorsMap = {}
  const actionToReducersMap = {}
  let currentActionTypes = []


  const reactor = (state = initialState, action) =>
    handleReactorLayer(actionToReducersMap, runReducers, state, action)


  reactor.effects = (...args) =>
    handleReactorLayer(actionToEffectCreatorsMap, runEffectCreators, ...args)


  reactor.to = (...actors) => {
    currentActionTypes = extractActionTypes(actors, 'ZeduxReactor.to()')

    return reactor // for chaining
  }


  reactor.toEverything = () => {
    currentActionTypes = [ GLOBAL_ACTION_TYPE ]

    return reactor // for chaining
  }


  reactor.withEffects = function() {
    mapActionTypesToConsumers(
      actionToEffectCreatorsMap,
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


function runEffectCreators(effectCreators, state, action) {
  return effectCreators.reduce((effects, effectCreator) => {
    const processable = effectCreator(state, action)

    // TODO: What all can a ZeduxReactor sub-effectCreator return?
    processableToPromise(processable)

    return effects
  }, [])
}


function runReducers(reducers, state, action) {
  return reducers.reduce(
    (accumulatedState, reducer) => reducer(accumulatedState, action), state
  )
}
