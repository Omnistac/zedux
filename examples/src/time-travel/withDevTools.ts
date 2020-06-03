import { Store } from '@zedux'

const DISPATCH = 'DISPATCH'
const START = 'START'

export const withDevTools = (wrappedStore: Store) => {
  const devTools =
    (window as any).__REDUX_DEVTOOLS_EXTENSION__ &&
    (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect()

  const initialState = wrappedStore.getState()

  // Set up the devTools
  devTools.subscribe(({ payload, state, type }: any) => {
    if (type === START) {
      devTools.init(wrappedStore.getState())
    }

    if (type !== DISPATCH) return

    switch (payload.type) {
      case 'COMMIT':
        return devTools.init(wrappedStore.getState())

      case 'IMPORT_STATE':
        const { nextLiftedState } = payload
        const { computedStates } = nextLiftedState
        const newState = computedStates[computedStates.length - 1].state

        wrappedStore.hydrate(newState)

        return devTools.send(null, nextLiftedState)

      case 'JUMP_TO_ACTION':
      case 'JUMP_TO_STATE':
        return wrappedStore.hydrate(JSON.parse(state))

      case 'RESET':
        return devTools.init(wrappedStore.hydrate(initialState))

      case 'ROLLBACK':
        return devTools.init(wrappedStore.hydrate(JSON.parse(state)))

      case 'TOGGLE_ACTION':
        return devTools.send(
          null,
          toggleAction(wrappedStore, payload.id, JSON.parse(state))
        )
    }
  })

  wrappedStore.subscribe({
    effects: ({ action, newState }) => {
      console.log('sending...?', action, newState)
      devTools.send(action, newState)
    },
  })

  return wrappedStore
}

function findLastUnskippedState(
  targetActionIndex: number,
  computedStates: any[],
  skippedActionIds: string[],
  stagedActionIds: string[]
) {
  for (let i = targetActionIndex - 1; i > 0; i--) {
    const currentActionId = stagedActionIds[i]

    if (skippedActionIds.includes(currentActionId)) continue

    // This action isn't skipped. Return its corresponding state.
    return computedStates[i].state
  }

  // We didn't find an unskipped, skippable state. Use the initial state.
  return computedStates[0].state
}

function toggleAction(store: Store, actionId: string, liftedState: any) {
  const { computedStates, skippedActionIds, stagedActionIds } = liftedState

  const skippedActionIndex = skippedActionIds.indexOf(actionId)
  const wasSkipped = skippedActionIndex !== -1
  const targetActionIndex = stagedActionIds.indexOf(actionId)

  if (targetActionIndex === -1) return liftedState

  // Remove or add the current action id to the list of skipped action ids
  const newSkippedActionIds = wasSkipped
    ? [
        ...skippedActionIds.slice(0, skippedActionIndex),
        ...skippedActionIds.slice(skippedActionIndex + 1),
      ]
    : [...skippedActionIds, actionId]

  const newComputedStates = [...computedStates]

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
      state: store.dispatch(action),
    }
  }

  return {
    ...liftedState,
    computedStates: newComputedStates,
    skippedActionIds: newSkippedActionIds,
  }
}
