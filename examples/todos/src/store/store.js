import { createStore } from 'zedux'

import todos from './reactors/todos'


export default createStore()
  .use({
    todos
  })
