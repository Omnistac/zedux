import { react } from 'zedux'

import { addTodo } from './todos'


export default react('')
  .to(addTodo)
  .withReducers(() => '') // reset the state
