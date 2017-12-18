# Examples

This page is a good place to start learning Zedux. Let's jump right in. Refer to the [api](/docs/api/README.md) and [types documentation](/docs/types/README.md) if you get lost.

## Counter

Nice and easy.

```javascript
import { act, createStore, react } from 'zedux'

const increment = act('increment')
const decrement = act('decrement')

const counterReactor = react(0)
  .to(increment)
  .withReducers(state => state + 1)

  .to(decrement)
  .withReducers(state => state - 1)

const store = createStore()
  .use(counterReactor)

store.dispatch(increment())
store.dispatch(increment())
store.dispatch(decrement())

store.getState() // 1
```

See the [createStore](/docs/api/createStore.md), [act](/docs/api/act.md), and [react](/docs/api/react.md) api docs.

## Todos

### `store/todos.js`

```javascript
import { act, react } from 'zedux'

export const addTodo = act('addTodo')
export const toggleTodo = act('toggleTodo')

export default react([])
  .to(addTodo)
  .withReducers(addTodoReducer)

  .to(toggleTodo)
  .withReducers(toggleTodoReducer)

function addTodoReducer(state, { payload: text }) {
  const id = todosIdCounter++
  const newTodo = { id, text, isComplete: false }

  return [ ...state, newTodo ]
}

function toggleTodoReducer(state, { payload: id }) {
  return state.map(todo =>
    todo.id === id
      ? { ...todo, isComplete: !todo.isComplete }
      : todo
  )
}
```

See the [act](/docs/api/act.md) and [react](/docs/api/react.md) api docs.

### `store/visibilityFilter.js`

```javascript
import { state, transition } from 'zedux'

export const showAll = state('showAll')
export const showCompleted = state('showCompleted')
export const showIncomplete = state('showIncomplete')

export default transition(showAll)
  .undirected(showAll, showCompleted, showIncomplete)
```

This example uses the not-yet-implemented state machine model. We declare a few states then create a reactor using the special `transition()` factory that describes how states transition to and from each other. Here we're using the special `undirected()` method which creates undirected graph edges between the given states.

This will be implemented before the first pre-release.

### `store/index.js`

```javascript
import { createStore } from 'zedux'

import todos from './todos'
import visibilityFilter from './visibilityFilter'

export const store = createStore({
  todos,
  visibilityFilter
})
```

See the [createStore](/docs/api/createStore.md) api doc.
