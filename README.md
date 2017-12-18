# Zedux

[![Build Status](https://travis-ci.org/bowheart/zedux.svg?branch=master)](https://travis-ci.org/bowheart/zedux)
[![Test Coverage](https://api.codeclimate.com/v1/badges/0459ebf8444c36752eac/test_coverage)](https://codeclimate.com/github/bowheart/zedux/test_coverage)

The complete state management solution.

Zedux is a futuristic Redux. It conforms to *almost* every philosophy of Redux, while opinionatedly straying when it thinks there may be a better way.

Zedux is a battleground for testing many ideas that have been thrown around the Redux community for a long time, with no course of action being taken. In Zedux, ideas like state machines, easy hierarchical code splitting, zero-configuration, and composable stores are the norms. The goal of Zedux is to innovate Redux.

## Intro

Redux has landed itself in an awkward spot. It's often "too much" for small applications, yet nowhere near extensive enough for large apps. The low-level api and the sheer number of plugins required to make Redux work make it an impractical choice for many situations. While the simplicity of Redux is a huge asset, it is nevertheless a sad fact that many people reject Redux due to the side effects of simplicity.

Zedux believes in simplicity too. But Zedux approaches it from the user's perspective first, and a code perspective second. This means Zedux has an incredibly straight-forward, declarative api and almost none of the verbosity of Redux.

Zedux does not, however, conform to the philosophy that simple equals bare. Zedux aims to offer a full-fledged, complete api for all common state management needs. This includes asynchronicity, massive performance optimizations, state hydration, code splitting, and memoization/state derivation.

Note to the purists: "full-fledged, complete api" does not mean it tries to do everything. The fear of bikeshedding has been a rather efficient taskmaster throughout the development of Zedux. Zedux implements functionality for only the most common use cases, leaving the less common stuff up to plugins.

## Quick Start

At the most basic level, Zedux is still Redux. A reducer hierarchy drives state creation and updates. Let's get some code:

```javascript
import { createStore } from 'zedux'

const rootReducer = (state = 'hello', action) =>
  action.payload || state

const store = createStore()
  .use(rootReducer)

store.subscribe(console.log)

const prevState = store.getState()
const newState = store.dispatch({
  type: 'doThisThing',
  payload: 'world'
}) // logs "hello world"
```

If you know Redux, almost every bit of this will seem instantly familiar. This example is meant to show the similarities...So let's focus on the differences:

### Creating the store

Zedux cleans up the `createStore()` api; no more optional initial state parameter and, more importantly, [no more middleware](/docs/guides/theInspectorLayer.md)! :O `createStore()` has the form:

```javascript
() => Store
```

And that's all! This simplicity makes [zero-configuration](/docs/guides/zeroConfiguration.md) a possibility. Perfect for small applications. But if we want some more advanced functionality, we'll have to look at:

### Modifying the store

[`store.use()`](/docs/api/Store.md#storeuse) is our friend here. This is how we'll dynamically introduce our reducer hierarchy to the store. Consequently, this is the mechanism that makes code splitting a breeze. We could use it like so to mimic the `replaceReducer()` functionality of Redux:

```javascript
store.use(rootReducer)
store.use(newRootReducer)
```

But that's somewhere between lame and a yawn. Let's be awesome:

```javascript
import todos from './reducers/todos'

store.use({
  todos
})
```

By default, this'll make our store's state look like so:

```javascript
{
  todos: /* result of calling our todos reducer */
}
```

Yes, immutable fans, "by default" means the actual hierarchical data type representing the intermediate nodes can be changed. See the guide on [Configuring the Hierarchy](/docs/guides/configuringTheHierarchy.md).

(Some async amount of time later:) Oh, we also need the famed visibility filter state in our store:

```javascript
import visibilityFilter from './reducers/visibilityFilter'

store.use({
  visibilityFilter
})
```

Zedux will merge the new shape into the existing hierarchy and recalculate the state of our store. We'll end up with our state looking something like:

```javascript
{
  todos: /* result of calling our todos reducer */,
  visibilityFilter: /* result of calling our visibilityFilter reducer */
}
```

Awesome. But how about a nested structure?

```javascript
store.use({
  entities: {
    normalTodos: todosReducer
    urgentTodos: todosReducer,
  },
  visibilityFilter
})
```

Check out the [merging hierarchies guide](/docs/guides/mergingHierarchies.md) for a comprehensive run-down of `store.use()`.

### Using the store

`store.subscribe()`, `store.dispatch()`, and `store.getState()` work almost exactly how you'd expect. Two little exceptions:

```javascript
store.subscribe((prevState, newState) => {
  // Subscribers are passed both the old state and new state
  // This is what made our "hello world" example work
})
```

```javascript
// Since Zedux stores are completely synchronous,
// the new state is returned directly from a dispatch.
const newState = store.dispatch()
```

### To be continued...

That does it for the quick start. Check out the [full documentation](/docs/overview.md) for the real cool stuff. Here's a little taste of what's in store (Yes, that pun was an accident. No, I don't like calamari):

- Standardized reducer creation (kills string constants and switch statements/action-reducer maps)

```javascript
import { act, react } from 'zedux'

export const createTodo = act('createTodo')

export default react([])
  .to(createTodo)
  .withReducers(createTodoReducer)

function createTodoReducer(state, { payload: newTodo }) {
  return [ ...state, newTodo ]
}
```

- Composable, memoized selectors

```javascript
import { select } from 'zedux'

export const selectTodos = state => state.todos

export const selectIncompleteTodos = select(
  selectTodos,
  todos => todos.filter(todo => !todo.isComplete)
)
```

- meta chains and standard meta types for some sick optimizations

```javascript
import { metaTypes } from 'zedux'

store.dispatch({
  metaType: metaTypes.SKIP_REDUCERS,
  action: {
    type: 'addTodo',
    payload: 'be awesome'
  }
})
```

- store composition! With a whole lot of support for loads of crazy inter-store communication. A benchmarker's dream.

```javascript
import { createStore } from 'zedux'
import { entities, visibilityFilter } from './reducers'

const todosStore = createStore()
  .use({ entities, visibilityFilter })

const rootStore = createStore()
  .use({
    todos: todosStore
  })

rootStore.subscribe(() => {
  console.log('root store updated!')
})

todosStore.dispatch({
  type: 'addTodo',
  payload: 'be just like wow'
}) // logs "root store updated!"
```

- We haven't even touched inspectors/processors, time travel, asynchronicity, dispatchable reducers, action namespacing, or state machines. Check out [the docs](/docs/overview.md) already!

## It seems too big

Mm. It really isn't. You may think this because Redux is so tiny. But compare it to something like Rx, which is a complete solution in its field, and Zedux is very tiny. Currently it's almost twice the size of Redux, but accomplishes way more than twice as much. In fact, given the reduced number of plugins, your app's dependencies will almost certainly be smaller with Zedux than with Redux.

That said, if we find that anything is not used enough to make it worth including in Zedux core, we'll definitely take it out. On the flip side, if any features are sorely needed and not included, we'll gladly consider including them. Zedux has only a faint coat of feature-creep repellent.

## Contributing

All contributions on any level are so overwhelmingly welcome. Just jump right in. Open an issue. PRs, just keep the coding style consistent and the tests at 100% (branches, functions, lines, everything 100%, plz). Let's make this awesome!

## License

The MIT License.
