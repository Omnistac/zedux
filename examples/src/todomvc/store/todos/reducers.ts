import { createReducer } from '@zedux'
import {
  addTodo,
  clearComplete,
  removeTodo,
  toggleAllComplete,
  toggleComplete,
  updateTodo,
} from './actions'
import { Todo } from '../../types'

export interface TodosState {
  [key: string]: Todo
}

let idCounter = 0

export const todos = createReducer<TodosState>({})
  .reduce(addTodo, (state, text) => {
    const id = `todo-${idCounter++}`

    return {
      ...state,
      [id]: { id, text, isComplete: false },
    }
  })

  .reduce(clearComplete, state => {
    const newState = { ...state }

    Object.entries(state).forEach(([id, todo]) => {
      if (!todo.isComplete) return

      delete newState[id]
    })

    return newState
  })

  .reduce(removeTodo, (state, id) => {
    const newState = { ...state }

    delete newState[id]

    return newState
  })

  .reduce(toggleAllComplete, (state, areAllComplete) => {
    const newState: TodosState = {}

    Object.entries(state).forEach(([id, todo]) => {
      if (todo.isComplete === !areAllComplete) return (newState[id] = todo)

      newState[id] = {
        ...todo,
        isComplete: !areAllComplete,
      }
    })

    return newState
  })

  .reduce(toggleComplete, (state, id) => ({
    ...state,
    [id]: {
      ...state[id],
      isComplete: !state[id].isComplete,
    },
  }))

  .reduce(updateTodo, (state, { id, text }) => ({
    ...state,
    [id]: {
      ...state[id],
      text,
    },
  }))
