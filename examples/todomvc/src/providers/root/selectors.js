import { select } from 'zedux'


export const selectTodos = state => state.todos
export const selectVisibilityFilter = state => state.visibilityFilter


export const selectTodoIds = select(
  selectTodos,
  todos => Object.keys(todos)
)


export const selectCompleteTodos = select(
  selectTodos,
  todos => {
    const completeTodos = {}

    Object.entries(todos).forEach(([ key, todo ]) => {
      if (todo.isComplete) completeTodos[key] = todo
    })

    return completeTodos
  }
)


export const selectCompleteTodoIds = select(
  selectCompleteTodos,
  todos => Object.keys(todos)
)


export const selectIncompleteTodos = select(
  selectTodos,
  todos => {
    const incompleteTodos = {}

    Object.entries(todos).forEach(([ key, todo ]) => {
      if (!todo.isComplete) incompleteTodos[key] = todo
    })

    return incompleteTodos
  }
)


export const selectIncompleteTodoIds = select(
  selectIncompleteTodos,
  todos => Object.keys(todos)
)


export const selectAreAllComplete = select(
  selectTodos,
  selectIncompleteTodos,
  (todos, incompleteTodos) => Object.keys(todos).length
    && !Object.keys(incompleteTodos).length
)
