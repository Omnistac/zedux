import { select } from 'zedux'


export const selectTodos = state => state.todos


export const selectIncompleteTodos = select(
  selectTodos,
  todos => todos.filter(todo => !todo.complete)
)
