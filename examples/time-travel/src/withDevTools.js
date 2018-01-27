const DISPATCH = 'DISPATCH'
const START = 'START'


export default store => {
  const devTools = window.__REDUX_DEVTOOLS_EXTENSION__
    && window.__REDUX_DEVTOOLS_EXTENSION__.connect()


  const initialState = store.getState()


  // Set up the devTools
  devTools.subscribe(({ payload, state, type }) => {
    if (type === START) {
      devTools.init(store.getState())
    }

    if (type !== DISPATCH) return

    switch (payload.type) {
      case 'COMMIT':
        return devTools.init(store.getState())

      case 'IMPORT_STATE':
        const { nextLiftedState } = payload
        const { computedStates } = nextLiftedState
        const newState = computedStates[computedStates.length - 1].state

        store.hydrate(newState)

        return devTools.send(null, nextLiftedState)

      case 'JUMP_TO_ACTION':
      case 'JUMP_TO_STATE':
        return store.hydrate(JSON.parse(state))

      case 'RESET':
        return devTools.init(store.hydrate(initialState))

      case 'ROLLBACK':
        return devTools.init(store.hydrate(JSON.parse(state)))

      case 'TOGGLE_ACTION':
        return devTools.send(
          null,
          toggleAction(store, payload.id, JSON.parse(state))
        )
    }
  })


  let pendingAction = null


  // Add an inspector to the store
  const inspection = store.inspect((storeBase, action) => {
    if (pendingAction) return

    pendingAction = action
  })


  // Add a subscriber to the store
  const subscription = store.subscribe((oldState, newState) => {
    devTools.send(pendingAction, newState)

    pendingAction = null
  })


  return store
}


function findLastUnskippedState(
  targetActionIndex,
  computedStates,
  skippedActionIds,
  stagedActionIds
) {
  for (let i = targetActionIndex - 1; i > 0; i--) {
    let currentActionId = stagedActionIds[i]

    if (skippedActionIds.includes(currentActionId)) continue

    // This action isn't skipped. Return its corresponding state.
    return computedStates[i].state
  }

  // We didn't find an unskipped, skippable state. Use the initial state.
  return computedStates[0].state
}


function toggleAction(store, actionId, liftedState) {
  const { computedStates, skippedActionIds, stagedActionIds } = liftedState

  const skippedActionIndex = skippedActionIds.indexOf(actionId)
  const wasSkipped = skippedActionIndex !== -1
  let targetActionIndex = stagedActionIds.indexOf(actionId)

  if (targetActionIndex === -1) return liftedState

  // Remove or add the current action id to the list of skipped action ids
  const newSkippedActionIds = wasSkipped
    ? [
        ...skippedActionIds.slice(0, skippedActionIndex),
        ...skippedActionIds.slice(skippedActionIndex + 1)
      ]
    : [ ...skippedActionIds, actionId ]


  const newComputedStates = [ ...computedStates ]

  // Start the store at the state it was in just before the target action
  store.hydrate(
    findLastUnskippedState(
      targetActionIndex,
      computedStates,
      skippedActionIds,
      stagedActionIds
    )
  )

  // Re-dispatch all actions after (and maybe including) the target action
  for (let i = targetActionIndex; i < stagedActionIds.length; i++) {
    const stagedActionId = stagedActionIds[i]

    if (newSkippedActionIds.includes(stagedActionId)) {
      continue // this action is currently being skipped
    }

    const { action } = liftedState.actionsById[stagedActionId]

    newComputedStates[i] = {
      ...newComputedStates[i],
      state: store.dispatch(action)
    }
  }

  return {
    ...liftedState,
    computedStates: newComputedStates,
    skippedActionIds: newSkippedActionIds
  }
}
