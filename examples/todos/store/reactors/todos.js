import { act, react } from 'zedux'


export const addTodo = act('addTodo')
export const removeTodo = act('removeTodo')


export default react([])
  .to(addTodo)
  .withReducers(addTodoReducer)

  .to(removeTodo)
  .withReducers(removeTodoReducer)





function addTodoReducer(state, { payload: text }) {
  let newTodo = {
    text
  }

  return [ ...state, newTodo ]
}


function removeTodoReducer(state, { payload: index }) {
  return [
    ...state.slice(0, index),
    ...state.slice(index + 1)
  ]
}
