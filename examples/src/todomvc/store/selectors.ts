import { createSelector } from '@zedux'
import {
  selectTodoIds,
  selectCompleteTodoIds,
  selectIncompleteTodoIds,
} from './todos'
import {
  selectVisibilityFilter,
  showAll,
  showComplete,
  showIncomplete,
} from './visibilityFilter'

// The `state => state` input selector ruins memoization here
// (the selector will now recalculate on every state change)
// That is fine. The selectors used in the selector's body are still memoized.
// And even if they weren't, one needn't worry about memoization all the time.
export const selectFilteredTodos = createSelector(
  state => state,
  selectVisibilityFilter,
  (state, visibilityFilter) => {
    if (visibilityFilter === showAll.type) {
      return selectTodoIds(state)
    }

    if (visibilityFilter === showComplete.type) {
      return selectCompleteTodoIds(state)
    }

    if (visibilityFilter === showIncomplete.type) {
      return selectIncompleteTodoIds(state)
    }
  }
)
