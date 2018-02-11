export const addTodo = store => event => {
  event.preventDefault()

  const { todoText } = store.getState()

  if (!todoText) return // can't add an empty todo

  store.wrappedActors.addTodo(todoText)
}


export const selectFilteredTodos = store => () => {
  const visibilityFilter = store.selectVisibilityFilter()

  const selectTodoIds = {
    [store.showAll.type]: store.selectTodoIds,
    [store.showComplete.type]: store.selectCompleteTodoIds,
    [store.showIncomplete.type]: store.selectIncompleteTodoIds
  }[visibilityFilter]

  return selectTodoIds()
}


export const selectTodoById = store => id => {
  const todos = store.selectTodos()

  return todos[id]
}


export const setTodoText = store => ({ currentTarget: { value } }) => {
  store.setState({ todoText: value })
}


export const toggleAllComplete = store => () => {
  const areAllComplete = store.selectAreAllComplete()

  store.wrappedActors.toggleAllComplete(areAllComplete)
}
