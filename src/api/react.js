import { assertIsValidActor } from '../utils/errors'
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


  const reactor = (state = initialState, action) => {
    const actionType = action.type

    const reducers = [
      ...actionToReducersMap[actionType] || [],
      ...actionToReducersMap[GLOBAL_ACTION_TYPE] || []
    ]

    return runReducers(reducers, state, action)
  }


  reactor.process = (dispatch, action, state) => {
    const actionType = action.type

    const processors = [
      ...actionToProcessorsMap[actionType] || [],
      ...actionToProcessorsMap[GLOBAL_ACTION_TYPE] || []
    ]

    runProcessors(processors, dispatch, action, state)
  }


  reactor.to = (...actors) => {
    currentActionTypes = actors.map(actor => {

      // The "actor" may be a literal action type string
      if (typeof actor === 'string') return actor

      assertIsValidActor(actor)

      return actor.type
    })

    return reactor // for chaining
  }


  reactor.toEverything = () => {
    currentActionTypes = [ GLOBAL_ACTION_TYPE ]

    return reactor // for chaining
  }


  reactor.withProcessors = (...processors) => {
    currentActionTypes.forEach(actionType => {
      processors.forEach(processor => {

        if (!actionToProcessorsMap[actionType]) {
          actionToProcessorsMap[actionType] = []
        }
        actionToProcessorsMap[actionType].push(processor)
      })
    })

    return reactor // for chaining
  }


  reactor.withReducers = (...reducers) => {
    currentActionTypes.forEach(actionType => {
      reducers.forEach(reducer => {

        if (!actionToReducersMap[actionType]) {
          actionToReducersMap[actionType] = []
        }
        actionToReducersMap[actionType].push(reducer)
      })
    })

    return reactor // for chaining
  }


  return reactor
}





function runProcessors(processors, ...args) {
  processors.forEach(processor => {
    const processable = processor(...args)

    processableToPromise(processable)
  })
}


function runReducers(reducers, state, action) {
  return reducers.reduce(
    (accumulatedState, reducer) => reducer(accumulatedState, action), state
  )
}
