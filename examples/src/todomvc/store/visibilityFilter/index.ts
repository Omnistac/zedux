import { createActorFactory, createMachine } from '@zedux'

// Bad. But it's okay until ../context needs to import something from this duck
// If that happened, we'd need to break these actors, reducer, and selector out
// into their own files
import { RootState } from '../context'

// Sticking actors, reducers, and selectors in the same file isn't normally ok
// since they all have different modular priorities. But it is fine sometimes.
// The overhead of breaking these out in their own files isn't worth it here.
// And that's fine.
const createActor = createActorFactory('@visibilityFilter')

// States for a machine are just normal actors. The state saved in ... state ...
// will be the string action type of the actor.
export const showAll = createActor('showAll')
export const showComplete = createActor('showComplete')
export const showIncomplete = createActor('showIncomplete')

// visibilityFilter is just a Reducer<string>
export const visibilityFilter = createMachine(showAll).addUndirectedTransitions(
  showAll,
  showComplete,
  showIncomplete
)

export const selectVisibilityFilter = (state: RootState) =>
  state.visibilityFilter
