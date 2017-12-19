# Zedux

[![Build Status](https://travis-ci.org/bowheart/zedux.svg?branch=master)](https://travis-ci.org/bowheart/zedux)
[![Test Coverage](https://api.codeclimate.com/v1/badges/0459ebf8444c36752eac/test_coverage)](https://codeclimate.com/github/bowheart/zedux/test_coverage)
[![npm](https://img.shields.io/npm/v/zedux.svg)](https://www.npmjs.com/package/zedux)

The complete state management solution.

Zedux is a futuristic Redux. It conforms to *almost* every philosophy of Redux, while opinionatedly straying when it thinks there may be a better way.

The goal of Zedux is to innovate Redux. In the Zedux world, ideas like state machines, easy hierarchical code splitting, zero-configuration, and composable stores are the norms.

## Installation

Install using npm:

```bash
npm install --save zedux
```

Or include the appropriate unpkg build on your page:

### Development

```html
<script src="https://unpkg.com/zedux/dist/zedux.js"></script>
```

### Production

```html
<script src="https://unpkg.com/zedux/dist/zedux.min.js"></script>
```

## Getting started

To learn by example, check out the [examples doc page](https://bowheart.github.io/zedux/docs/examples) or the [examples in the repo](https://github.com/bowheart/zedux/tree/master/examples).

To learn by getting dirty, have a play with [this codepen](https://codepen.io/bowheart/pen/MrKMmw?editors=0010).

To learn from us, check out the [documentation](https://bowheart.github.io/zedux/docs/overview).

To learn comprehensively, check out [the tests](https://github.com/bowheart/zedux/tree/master/test).

Or keep reading for a brief run-down:

## Intro

Redux has landed itself in an awkward spot. It's often too much for small applications, yet nowhere near extensive enough for large apps. The low-level api and the sheer number of plugins required to make Redux work make it an impractical choice for many situations. While the simplicity of Redux is a huge asset, it is nevertheless a sad fact that many people reject Redux due to the side effects of simplicity.

Zedux believes in simplicity too. But Zedux approaches it from the user's perspective first, and a code perspective second. This means Zedux has an incredibly straight-forward, declarative api and almost none of the verbosity of Redux.

Zedux does not, however, conform to the philosophy that simple equals bare. Zedux aims to offer a complete api for all common state management needs. This includes asynchronicity, performance optimizations, state hydration, code splitting, and memoization/state derivation.

## Quick Start

At the most basic level, Zedux is still Redux. A reducer hierarchy drives state creation and updates. Let's get some code:

```javascript
import { createStore } from 'zedux'

const store = createStore()

const rootReducer = (state = 'hello', action) =>
  action.payload || state

store.use(rootReducer)

store.subscribe(console.log)

const prevState = store.getState()
const newState = store.dispatch({
  type: 'doThisThing',
  payload: 'world'
}) // logs "hello world"
```

If you know Redux, almost every bit of this will seem instantly familiar. This example is meant to show the similarities...So let's focus on the differences:

### Creating the store

Zedux cleans up the `createStore()` api; no more optional initial state parameter and, more importantly, [no more middleware](https://bowheart.github.io/zedux/docs/guides/theInspectorLayer)! :O `createStore()` has the form:

```javascript
() => Store
```

And that's all! This simplicity makes [zero-configuration](https://bowheart.github.io/zedux/docs/guides/zeroConfiguration) a possibility. Perfect for small applications. But if we want some more advanced functionality, we'll have to look at:

### Modifying the store

[`store.use()`](https://bowheart.github.io/zedux/docs/api/Store#storeuse) is our friend here. This is how we'll dynamically introduce our reducer hierarchy to the store. Consequently, this is the mechanism that makes code splitting a breeze. We could use it like so to mimic the `replaceReducer()` functionality of Redux:

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

Yes, immutable fans, "by default" means the actual hierarchical data type representing the intermediate nodes can be changed. See the guide on [Configuring the Hierarchy](https://bowheart.github.io/zedux/docs/guides/configuringTheHierarchy).

(Some async amount of time later:) Oh, we also need the famed visibility filter in our store:

```javascript
import visibilityFilter from './reducers/visibilityFilter'

store.use({
  visibilityFilter
})
```

Zedux will merge the new shape into the existing hierarchy and recalculate the state of our store. We'll end up with our state tree looking like so:

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
    normalTodos: todosReducer,
    urgentTodos: todosReducer
  },
  visibilityFilter
})
```

Check out the [merging hierarchies guide](https://bowheart.github.io/zedux/docs/guides/mergingHierarchies) for a comprehensive run-down of `store.use()`.

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

That does it for the quick start. Check out the [full documentation](https://bowheart.github.io/zedux/docs/overview) for the real cool stuff. Here's a little taste of what's in store (yes, that pun was an accident):

- Standardized reducer creation (kills string constants and switch statements/action-reducer maps).

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

- Composable, memoized selectors.

```javascript
import { select } from 'zedux'

export const selectTodos = state => state.todos

export const selectIncompleteTodos = select(
  selectTodos,
  todos => todos.filter(todo => !todo.isComplete)
)
```

- Meta chains and standard meta types that allow store composition and some sick optimizations.

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

- Store composition! With a whole lot of support for loads of crazy inter-store communication. A benchmarker's dream.

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

- We haven't even touched inspectors/processors, time travel, asynchronicity, dispatchable reducers, action namespacing, or state machines. Check out [the docs](https://bowheart.github.io/zedux/docs/overview) already!

## It seems too big

Mm. It really isn't. You may think this because Redux is so tiny. But compare it to something like [Rx](https://github.com/Reactive-Extensions/RxJS), which is a complete solution in its field, and Zedux is very tiny. Currently it's almost twice the size of Redux, but accomplishes way more than twice as much. In fact, given the reduced number of plugins, your app's dependencies will almost certainly be smaller with Zedux than with Redux.

That said, if we find that anything is not used enough to make it worth including in Zedux core, we'll definitely take it out. On the flip side, if any features are sorely needed and not included, we'll gladly consider including them. Zedux has only a faint coat of feature-creep repellent.

## Contributing

All contributions on any level are so overwhelmingly welcome. Just jump right in. Open an issue. PRs, just keep the coding style consistent and the tests at 100% (branches, functions, lines, everything 100%, plz). Let's make this awesome!

Bugs can be submitted to https://github.com/bowheart/zedux/issues

## License

The MIT License.
