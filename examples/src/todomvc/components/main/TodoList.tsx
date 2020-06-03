import React, { useContext } from 'react'
import { useZeduxState } from '../../../hooks/useZeduxState'
import { RootContext, selectFilteredTodos } from '../../store'
import { TodoItem } from './TodoItem'

export const TodoList = () => {
  const store = useContext(RootContext)
  const state = useZeduxState(store)
  const filteredTodos = selectFilteredTodos(state)

  return (
    <ul className="todo-list">
      {filteredTodos.map(id => (
        <TodoItem key={id} id={id} />
      ))}
    </ul>
  )
}
