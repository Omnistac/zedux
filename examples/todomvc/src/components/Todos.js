import React from 'react'
import TodosProvider from '../providers/TodosProvider'


export default function Todos() {
  return (
    <TodosProvider>
      <TodoList />
      <VisibilityFilter />
    </TodosProvider>
  )
}
