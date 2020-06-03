import { createReducer } from '@zedux'

// When importing actions in a reducer file, use very specific imports
// to avoid circular dependencies. Actions are lower modules than reducers,
// so this import is fine
import { addTodo } from '../todos/actions'

// Since this duck contains only a reducer, there's no need to break it out
// into its own file.
export const todoText = createReducer('').reduce(addTodo, () => '') // reset the state
