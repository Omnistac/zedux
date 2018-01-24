import { compose, select } from 'zedux'

import store from './store'
import {
  addTodo,
  clearComplete,
  editTodo,
  removeTodo,
  toggleAllComplete,
  toggleComplete
} from './todos'

import { showAll, showComplete, showIncomplete } from './visibilityFilter'


const selectTodos = state => state.todos
const selectVisibilityFilter = state => state.visibilityFilter


const selectTodoIds = select(
  selectTodos,
  todos => Object.keys(todos)
)


const selectCompleteTodos = select(
  selectTodos,
  todos => {
    const completeTodos = {}

    Object.entries(todos).forEach(([ key, todo ]) => {
      if (todo.isComplete) completeTodos[key] = todo
    })

    return completeTodos
  }
)


const selectCompleteTodoIds = select(
  selectCompleteTodos,
  todos => Object.keys(todos)
)


const selectIncompleteTodos = select(
  selectTodos,
  todos => {
    const incompleteTodos = {}

    Object.entries(todos).forEach(([ key, todo ]) => {
      if (!todo.isComplete) incompleteTodos[key] = todo
    })

    return incompleteTodos
  }
)


const selectIncompleteTodoIds = select(
  selectIncompleteTodos,
  todos => Object.keys(todos)
)


const selectAreAllComplete = select(
  selectTodos,
  selectIncompleteTodos,
  (todos, incompleteTodos) => Object.keys(todos).length
    && !Object.keys(incompleteTodos).length
)


const actors = {
  clearComplete,
  editTodo,
  removeTodo,
  showAll,
  showComplete,
  showIncomplete,
  toggleComplete
}


const selectors = {
  selectAreAllComplete,
  selectCompleteTodoIds,
  selectCompleteTodos,
  selectIncompleteTodoIds,
  selectIncompleteTodos,
  selectVisibilityFilter,
  selectTodoIds,
  selectTodos,
}


const utils = {
  addTodo(event) {
    event.preventDefault()

    const { todoText } = store.getState()

    if (!todoText) return // can't add an empty todo

    store.dispatch(addTodo(todoText))
  },


  selectFilteredTodos() {
    const state = store.getState()
    const visibilityFilter = selectVisibilityFilter(state)

    const targetTodoType = {
      [showAll.type]: '',
      [showComplete.type]: 'Complete',
      [showIncomplete.type]: 'Incomplete'
    }[visibilityFilter]

    return selectors[`select${targetTodoType}TodoIds`](state)
  },


  selectTodoById(id) {
    const todos = selectTodos(store.getState())

    return todos[id]
  },


  setTodoText({ currentTarget: { value } }) {
    store.setState({ todoText: value })
  },


  toggleAllComplete() {
    const areAllComplete = selectAreAllComplete(store.getState())

    store.dispatch(toggleAllComplete(areAllComplete))
  }
}


export default createInterface({
  actors,
  selectors,
  store,
  utils
})


function assertKeyDoesNotExist(storeInterface, key) {
  if (!storeInterface[key]) return true

  throw new Error(
    'React Zedux Error - createInterface() - '
    + `Duplicate key ${key} found.`
  )
}


function createInterface({ actors, selectors, store, utils }) {
  const { dispatch, getState, subscribe } = store
  const storeInterface = { getState, subscribe }

  // Add the actors
  Object.entries(actors).forEach(([ key, actor ]) => {
    assertKeyDoesNotExist(storeInterface, key)

    const boundActor = compose(dispatch, actor)
    boundActor.type = actor.type

    storeInterface[key] = boundActor
  })

  // Add the selectors
  Object.entries(selectors).forEach(([ key, selector ]) => {
    assertKeyDoesNotExist(storeInterface, key)

    storeInterface[key] = compose(selector, getState)
  })

  // Add the utils
  Object.entries(utils).forEach(([ key, util ]) => {
    assertKeyDoesNotExist(storeInterface, key)

    storeInterface[key] = util
  })

  return storeInterface
}
