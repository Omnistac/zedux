import React from 'react'
import { StoreApi, createContext } from 'react-zedux'
import { createStore } from 'zedux'

import * as selectors from './root/selectors'
import todos, {
  addTodo,
  clearComplete,
  editTodo,
  removeTodo,
  toggleAllComplete,
  toggleComplete
} from './root/todos'
import todoText from './root/todoText'
import visibilityFilter, {
  showAll,
  showComplete,
  showIncomplete
} from './root/visibilityFilter'


class RootApi extends StoreApi {
  store = createStore()
    .use({
      todos,
      todoText,
      visibilityFilter
    })
  
  static actors = {
    clearComplete,
    editTodo,
    removeTodo,
    showAll,
    showComplete,
    showIncomplete,
    toggleComplete,
    wrappedActors: {
      addTodo,
      toggleAllComplete
    }
  }

  static selectors = selectors

  addTodo = event => {
    event.preventDefault()

    const { todoText } = this.getState()

    if (!todoText) return // can't add an empty todo

    this.wrappedActors.addTodo(todoText)
  }


  selectFilteredTodos = () => {
    const visibilityFilter = this.selectVisibilityFilter()

    const selectTodoIds = {
      [showAll.type]: this.selectTodoIds,
      [showComplete.type]: this.selectCompleteTodoIds,
      [showIncomplete.type]: this.selectIncompleteTodoIds
    }[visibilityFilter]

    return selectTodoIds()
  }


  selectTodoById = id => {
    const todos = this.selectTodos()

    return todos[id]
  }


  setTodoText = ({ currentTarget: { value } }) => {
    this.setState({ todoText: value })
  }


  toggleAllComplete = () => {
    const areAllComplete = this.selectAreAllComplete()

    this.wrappedActors.toggleAllComplete(areAllComplete)
  }
}


const RootContext = createContext(RootApi)


export default RootContext


export const withRoot = RootContext.consume('rootStore')