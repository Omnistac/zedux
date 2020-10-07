import React, { useContext, useCallback } from 'react'
import { useZeduxState } from '../../hooks/useZeduxState'
import {
  RootContext,
  selectAreAllComplete,
  toggleAllComplete,
  selectTodoIds,
} from '../store'
import { TodoList } from './main/TodoList'

export const Main = () => {
  const store = useContext(RootContext)
  const state = useZeduxState(store)
  const areAllComplete = selectAreAllComplete(state)
  const todoIds = selectTodoIds(state)

  const handleToggleAll = useCallback(() => {
    store.dispatch(toggleAllComplete(areAllComplete))
  }, [areAllComplete, store])

  if (!todoIds.length) return null

  return (
    <section className="main">
      <input
        id="toggle-all"
        className="toggle-all"
        type="checkbox"
        checked={selectAreAllComplete(state)}
        onChange={handleToggleAll}
      />
      <label htmlFor="toggle-all">Mark all as complete</label>
      <TodoList />
    </section>
  )
}
