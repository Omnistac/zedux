import React, { useContext } from 'react'
import {
  RootContext,
  clearComplete,
  selectCompleteTodoIds,
  selectIncompleteTodoIds,
  selectVisibilityFilter,
  showAll,
  showIncomplete,
  showComplete,
} from '../store'
import { useZeduxState } from '../../hooks/useZeduxState'

const visibilityFilterLabels = {
  [showAll.type]: 'All',
  [showIncomplete.type]: 'Active',
  [showComplete.type]: 'Complete',
}

export const Footer = () => {
  const store = useContext(RootContext)
  const state = useZeduxState(store)
  const numCompleteTodos = selectCompleteTodoIds(state).length
  const numIncompleteTodos = selectIncompleteTodoIds(state).length
  const visibilityFilter = selectVisibilityFilter(state)

  return (
    <footer className="footer">
      <span className="todo-count">
        <strong>{numIncompleteTodos}</strong>
        &nbsp;item{numIncompleteTodos === 1 ? '' : 's'} left
      </span>
      <ul className="filters">
        {[showAll, showIncomplete, showComplete].map(actor => (
          <li key={actor.type}>
            <a
              className={visibilityFilter === actor.type ? 'selected' : ''}
              onClick={() => store.dispatch(actor())}
            >
              {visibilityFilterLabels[actor.type]}
            </a>
          </li>
        ))}
      </ul>
      {!numCompleteTodos ? null : (
        <button
          className="clear-completed"
          onClick={() => store.dispatch(clearComplete())}
        >
          Clear completed
        </button>
      )}
    </footer>
  )
}
