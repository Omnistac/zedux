import React from 'react'

import { withRoot } from '../providers/RootProvider'


export default withRoot(Footer)


const visibilityFilterLabels = [ 'All', 'Active', 'Complete' ]


function Footer({
  rootStore: {
    clearComplete,
    selectCompleteTodos,
    selectIncompleteTodos,
    selectVisibilityFilter,
    showAll,
    showComplete,
    showIncomplete
  }
}) {
  const numIncompleteTodos = Object.keys(selectIncompleteTodos()).length
  const visibilityFilter = selectVisibilityFilter()

  return (
    <footer className="footer">
			<span className="todo-count">
        <strong>{numIncompleteTodos}</strong>
        &nbsp;item{numIncompleteTodos === 1 ? '' : 's'} left
      </span>
			<ul className="filters">
        {[ showAll, showIncomplete, showComplete ].map((state, index) =>
          <li key={state.type}>
            <a
              className={visibilityFilter === state.type ? 'selected' : ''}
              onClick={state}
            >{visibilityFilterLabels[index]}</a>
          </li>
        )}
			</ul>
      {!Object.keys(selectCompleteTodos()).length ? null :
  			<button className="clear-completed" onClick={clearComplete}>
          Clear completed
        </button>
      }
		</footer>
  )
}
