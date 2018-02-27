import React from 'react'

import TodoList from './main/TodoList'
import { withRoot } from '../contexts/RootContext'


export default withRoot(Main)


function Main({
  rootStore: {
    toggleAllComplete,
    selectAreAllComplete,
    selectTodoIds
  }
}) {
  if (!selectTodoIds().length) return null

  return (
    <section className="main">
			<input
        id="toggle-all"
        className="toggle-all"
        type="checkbox"
        checked={selectAreAllComplete()}
        onChange={toggleAllComplete}
      />
			<label htmlFor="toggle-all">Mark all as complete</label>
			<TodoList />
		</section>
  )
}
