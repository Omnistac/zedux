import { createStore } from 'zedux'

import todos from './todos'
import todoText from './todoText'
import visibilityFilter from './visibilityFilter'


export default createStore()
  .use({
    todos,
    todoText,
    visibilityFilter
  })
