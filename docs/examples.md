# Examples

This page is a good place to start learning Zedux. Let's jump right in. Refer to the [api](/docs/api/README.md) and [types documentation](/docs/types/README.md) if you get lost.

## Counter

Nice and easy.

```javascript
import { act, createStore, react } from 'zedux'

// Create a couple actors (fancy action creators)
const increment = act('increment')
const decrement = act('decrement')

// Create the reactor (fancy reducer)
const counterReactor = react(0) // 0 - the reactor's initial state
  .to(increment)
  .withReducers(state => state + 1)

  .to(decrement)
  .withReducers(state => state - 1)

// Create the store
const store = createStore()
  .use(counterReactor)

// Play with it
store.dispatch(increment())
store.dispatch(increment())
store.dispatch(decrement())

store.getState() // 1
```

See the [createStore](/docs/api/createStore.md), [act](/docs/api/act.md), and [react](/docs/api/react.md) api docs.

See the [actor](/docs/types/Actor.md) and [reactor](/docs/types/Reactor.md) type docs.

## Todos

### `store/todos.js`

```javascript
import { act, react } from 'zedux'

// Create some actors (fancy action creators)
export const addTodo = act('addTodo')
export const toggleTodo = act('toggleTodo')

// Create the reactor (fancy reducer)
export default react([]) // [] - the reactor's initial state
  .to(addTodo)
  .withReducers(addTodoReducer)

  .to(toggleTodo)
  .withReducers(toggleTodoReducer)

let todosIdCounter = 0

// Create some hoisted sub-reducers for our reactor to delegate to
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

// Create some states (fancy actors)
export const showAll = state('showAll')
export const showCompleted = state('showCompleted')
export const showIncomplete = state('showIncomplete')

// Create the state machine (fancy reactor)
export default transition(showAll)
  .undirected(showAll, showCompleted, showIncomplete)
```

This example uses the [state machine model](/docs/guides/harnessingStateMachines.md). We declare a few [states](/docs/types/State.md) with the built-in [`state()` factory](/docs/api/state.md) then create a reactor using the built-in [`transition()`](/docs/api/transition.md) factory to create a [ZeduxMachine](/docs/api/ZeduxMachine.md).

Zedux machines are awesome for describing how states transition to and from each other. Here we're using the special [`undirected()`](/docs/api/ZeduxMachine.md#zeduxmachineundirected) method which creates undirected graph edges between all the given states.

### `store/index.js`

```javascript
import { createStore } from 'zedux'

import todos from './todos'
import visibilityFilter from './visibilityFilter'

// Create the store, passing a hierarchy descriptor.
export default createStore()
  .use({
    todos,
    visibilityFilter
  })
```

See the [createStore](/docs/api/createStore.md) api doc and the [HierarchyDescriptor](/docs/types/HierarchyDescriptor.md) type.

Now we can have fun with this guy:

```javascript
import store from './store/index'
import { showAll, showIncomplete } from './store/visibilityFilter'
import { addTodo, toggleTodo } from './store/todos'

store.subscribe((oldState, newState) => {
  console.log('state changed! Old state:', oldState, 'New state:', newState)
})

store.dispatch(showAll())
store.dispatch(addTodo('be the super genius'))
store.dispatch(toggleTodo(0))
```
