import React from 'react'

import Todo from './Todo'
import { withRoot } from '../../contexts/RootContext'


export default withRoot(TodoList)


function TodoList({
  rootStore: {
    selectFilteredTodos
  }
}) {
  return (
    <ul className="todo-list">
      {selectFilteredTodos().map(id =>
        <Todo key={id} id={id} />
      )}
    </ul>
  )
}
