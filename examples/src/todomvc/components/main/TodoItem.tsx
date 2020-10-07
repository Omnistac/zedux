import React, { useState, FC, useCallback, useContext } from 'react'
import { useZeduxState } from '../../../hooks/useZeduxState'
import {
  RootContext,
  updateTodo,
  removeTodo,
  toggleComplete,
} from '../../store'

const ENTER_KEY = 13
const ESC_KEY = 27

interface Props {
  id: string
}

export const TodoItem: FC<Props> = ({ id }) => {
  const store = useContext(RootContext)
  const { todos } = useZeduxState(store)
  const todo = todos[id]
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(todo.text)

  const cancelEdit = useCallback(() => {
    setIsEditing(false)
    setText(todo.text) // reset the text
  }, [todo])

  const saveEdit = useCallback(
    ({ currentTarget: { value } }) => {
      // Persist the edit to the store
      store.dispatch(
        updateTodo({
          id,
          text: value,
        })
      )

      // Also save stuff locally
      setIsEditing(false)
      setText(value)
    },
    [id, setIsEditing, setText, store]
  )

  const checkEditKey = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.which === ESC_KEY) return cancelEdit()
      if (event.which === ENTER_KEY) return saveEdit(event)
    },
    [cancelEdit, saveEdit]
  )

  const handleTextChange = useCallback(
    ({ currentTarget: { value } }) => {
      setText(value)
    },
    [setText]
  )

  const liClasses = []

  if (isEditing) liClasses.push('editing')
  if (todo.isComplete) liClasses.push('completed')

  return (
    <li className={liClasses.join(' ')}>
      <div className="view">
        <input
          className="toggle"
          type="checkbox"
          checked={todo.isComplete}
          onChange={() => store.dispatch(toggleComplete(id))}
        />
        <label onDoubleClick={() => setIsEditing(true)}>{text}</label>
        <button
          className="destroy"
          onClick={() => store.dispatch(removeTodo(id))}
        ></button>
      </div>
      <input
        className="edit"
        name={id}
        value={text}
        onChange={handleTextChange}
        onKeyUp={checkEditKey}
        onBlur={saveEdit}
      />
    </li>
  )
}
