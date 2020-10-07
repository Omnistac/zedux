import { createSelector } from '@zedux'

// Selectors are the highest module type in the ducks world.
// So importing directly from context and reducers files is fine.
import { RootState } from '../context'
import { TodosState } from './reducers'

export const selectTodos = (state: RootState) => state.todos
export const selectTodoIds = createSelector(
  selectTodos,
  todos => Object.keys(todos)
)

export const selectCompleteTodos = createSelector(
  selectTodos,
  todos => {
    const completeTodos: TodosState = {}

    Object.entries(todos).forEach(([key, todo]) => {
      if (todo.isComplete) completeTodos[key] = todo
    })

    return completeTodos
  }
)

export const selectCompleteTodoIds = createSelector(
  selectCompleteTodos,
  todos => Object.keys(todos)
)

export const selectIncompleteTodos = createSelector(
  selectTodos,
  todos => {
    const incompleteTodos: TodosState = {}

    Object.entries(todos).forEach(([key, todo]) => {
      if (!todo.isComplete) incompleteTodos[key] = todo
    })

    return incompleteTodos
  }
)

export const selectIncompleteTodoIds = createSelector(
  selectIncompleteTodos,
  todos => Object.keys(todos)
)

export const selectAreAllComplete = createSelector(
  selectTodos,
  selectIncompleteTodos,
  (todos, incompleteTodos) =>
    Object.keys(todos).length && !Object.keys(incompleteTodos).length
)
