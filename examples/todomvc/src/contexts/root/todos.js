import { act, react } from 'zedux'


export const addTodo = act('addTodo')
export const clearComplete = act('clearComplete')
export const editTodo = act('editTodo')
export const removeTodo = act('removeTodo')
export const toggleAllComplete = act('toggleAllComplete')
export const toggleComplete = act('toggleComplete')


let idCounter = 0


export default react({})
  .to(addTodo)
  .withReducers((state, { payload: text }) => {
    const id = idCounter++

    return {
      ...state,
      [id]: { id, text, isComplete: false }
    }
  })


  .to(clearComplete)
  .withReducers(state => {
    const newState = { ...state }

    Object.entries(state).forEach(([ id, todo ]) => {
      if (!todo.isComplete) return

      delete newState[id]
    })

    return newState
  })


  .to(editTodo)
  .withReducers((state, { payload: { id, text } }) => ({
    ...state,
    [id]: {
      ...state[id],
      text
    }
  }))


  .to(removeTodo)
  .withReducers((state, { payload: id }) => {
    const newState = { ...state }

    delete newState[id]

    return newState
  })


  .to(toggleAllComplete)
  .withReducers((state, { payload: areAllComplete }) => {
    const newState = {}

    Object.entries(state).forEach(([ id, todo ]) => {
      if (todo.isComplete === !areAllComplete) return newState[id] = todo

      newState[id] = {
        ...todo,
        isComplete: !areAllComplete
      }
    })

    return newState
  })


  .to(toggleComplete)
  .withReducers((state, { payload: id }) => ({
    ...state,
    [id]: {
      ...state[id],
      isComplete: !state[id].isComplete
    }
  }))
