# The Processor Layer

The processor layer is one of the 3 layers of a Zedux store. The processor and [inspector](/docs/guides/theInspectorLayer.md) layers are the pieces of Zedux that replace middleware in Redux.

The processor layer consists of all [processors](/docs/types/Processor.md) in the store's reactor hierarchy. A processor is attached to a [reactor](/docs/types/Reactor.md) by setting it as the reactor's `process` property.

When an action is dispatched to the store, the processor layer is always the last layer hit, after inspectors and reducers.

## Purpose

The processor layer is part of the side effects model of Zedux. It's used for responding to and "processing" specific actions. For example, a `fetchTodos` action would almost certainly be handled by a processor.

Processors are passed the store's [`dispatch`](/docs/api/Store.md#storedispatch) method. Processors will often dispatch several actions.

Processors are passed their relevant piece of state. Thus they can conditionally handle actions depending on their current state. However, processors are [shape agnostic](/docs/glossary.md#shape-agnostic). As such, they shouldn't rely on other pieces of the state tree. In the rare case that this is needed, an [inspector](/docs/types/Inspector.md) can be used as a [shape bound](/docs/glossary.md#shape-bound) processor of sorts.

## The gist

The processor layer lives parallel to the reducer layer. Zedux replaces the reducer hierarchy of Redux with a [reactor](/docs/types/Reactor.md) hierarchy. A reactor is just a reducer with an optional `process` property whose value is a processor.

Processors created with the [react](/docs/api/react.md) api can return iterators and observables by default.

## Examples

```javascript
import { act, createStore, react } from 'zedux'
import { post } from 'axios'

const store = createStore()

const addTodo = act('addTodo')

addTodo.requested = act('addTodo/requested')
addTodo.success = act('addTodo/success')
addTodo.failure = act('addTodo/failure')

const addTodoProcessor = (dispatch, action, state) => {
  dispatch(addTodo.requested)

  post('/todos/add', action.payload)
    .then(response => dispatch(addTodo.success(response)))
    .catch(error => dispatch(addTodo.failure(error)))
}

const addTodoReactor = react({
    isAddingTodo: false,
    todos: []
  })
  .to(addTodo)
  .withProcessors(addTodoProcessor)

  .to(addTodo.requested)
  .withReducers(state => ({ ...state, isAddingTodo: true }))

  .to(addTodo.success, addTodo.failure)
  .withReducers(state => ({ ...state, isAddingTodo: false }))

  .to(addTodo.success)
  .withReducers((state, { payload }) => ({
    ...state,
    todos: [ ...state.todos, payload ]
  }))

store.use(addTodoReactor)
```
