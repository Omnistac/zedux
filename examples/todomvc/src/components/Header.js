import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { withRoot } from '../providers/RootProvider'


export default withRoot(Header)


function Header({
  rootStore: {
    addTodo,
    setTodoText,
    state: {
      todoText
    }
  }
}) {
  return (
    <form className="header" onSubmit={addTodo}>
			<h1>todos</h1>
			<input
        className="new-todo"
        placeholder="What needs to be done?"
        autoFocus
        onChange={setTodoText}
        value={todoText}
      />
		</form>
  )
}
