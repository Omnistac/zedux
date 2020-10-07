import React, { useContext, useCallback, ChangeEvent, FormEvent } from 'react'
import { useZeduxState } from '../../hooks/useZeduxState'
import { RootContext, addTodo } from '../store'

export const Header = () => {
  const store = useContext(RootContext)
  const { todoText } = useZeduxState(store)

  const handleFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const { todoText } = store.getState()

      if (!todoText) return // can't add an empty todo

      store.dispatch(addTodo(todoText))
    },
    [store]
  )

  const handleTextChange = useCallback(
    ({ currentTarget: { value } }: ChangeEvent<HTMLInputElement>) => {
      // A little unorthodox, but it is still possible to use setState on
      // a store that uses a reducer hierarchy
      store.setState({ todoText: value })
    },
    [store]
  )

  return (
    <form className="header" onSubmit={handleFormSubmit}>
      <h1>todos</h1>
      <input
        className="new-todo"
        placeholder="What needs to be done?"
        autoFocus
        onChange={handleTextChange}
        value={todoText}
      />
    </form>
  )
}
