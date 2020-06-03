# Zedux

[![Build Status](https://travis-ci.org/bowheart/zedux.svg?branch=master)](https://travis-ci.org/bowheart/zedux)
[![Test Coverage](https://api.codeclimate.com/v1/badges/0459ebf8444c36752eac/test_coverage)](https://codeclimate.com/github/bowheart/zedux/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/0459ebf8444c36752eac/maintainability)](https://codeclimate.com/github/bowheart/zedux/maintainability)
[![npm](https://img.shields.io/npm/v/zedux.svg)](https://www.npmjs.com/package/zedux)

Overpowered State Management for JavaScript.

<div style="text-align: center">
  <img src="https://bowheart.github.io/zedux/img/intro.png" />
</div>

## Feature list of awesomeness

- [Composable stores](https://bowheart.github.io/zedux/docs/guides/storeComposition)
- [Built-in side effects model](https://bowheart.github.io/zedux/docs/guides/theProcessorLayer)
- [Reducer-driven state updates](https://bowheart.github.io/zedux/docs/guides/theReducerLayer)
- [Action creator utilities](FIXME)
- [Reducer creation utility](FIXME)
- [State machines](https://bowheart.github.io/zedux/docs/guides/harnessingStateMachines)
- [Code splitting](https://bowheart.github.io/zedux/docs/api/Store#storeuse)
- [Zero configuration](https://bowheart.github.io/zedux/docs/guides/zeroConfiguration)
- [Memoized selectors](https://bowheart.github.io/zedux/docs/api/select)

## Installation

Install using npm or yarn. E.g.:

```bash
npm i zedux
```

Or include the appropriate unpkg build on your page (module exposed as `window.Zedux`):

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

To learn comprehensively, check out the [documentation](https://bowheart.github.io/zedux/docs/overview).

To learn like a boss, check out the [tests](https://github.com/bowheart/zedux/tree/master/test).

Or keep reading for a brief run-down:

## Intro

FIXME: Maybe paste the philosophies from introduction.mdx here

## Quick start

> This guide will assume basic knowledge of Redux, such as how to use reducers and the importance of immutability.

At the most basic level, Zedux is still Redux. A reducer hierarchy drives state creation and updates. Let's get some code:

```ts
import { createActor, createReducer, createStore } from 'zedux'

/*
  Meet your first Zedux store.
  He's a fast, composable, predictable state container.
  And the best part is that he's all ready to go.
*/
const store = createStore()

/*
  These are actors.
  An actor is just a fancy action creator.
*/
const increment = createActor('increment')
const decrement = createActor('decrement')

/*
  Zedux ships with a high-level api for reducer creation.
  Here we delegate our actions to sub-reducers.
*/
const counterReducer = react(0) // 0 - the initial state
  .reduce(increment, state => state + 1)
  .reduce(decrement, state => state - 1)

/*
  So we said the store is all ready to go. And that's true.
  But in Zedux, zero configuration is optional <fireworks here>.
  We're not gonna use it here. We will in the next example.

  Here we introduce our reducer hierarchy to the store.
*/
store.use(counterReducer)

// Zedux calls this function every time the store's state changes.
store.subscribe((newState, oldState) => {
  console.log(`counter went from ${oldState} to ${newState}`)
})

store.dispatch(increment()) // counter went from 0 to 1
store.dispatch(increment()) // counter went from 1 to 2
store.dispatch(decrement()) // counter went from 2 to 1
```

If you know Redux, almost all of this will seem familiar. At this point, you should know enough to get started using Zedux. But don't worry, there's [a](https://bowheart.github.io/zedux/docs/guides/reactUsage) [ton](https://bowheart.github.io/zedux/docs/api/Store#storehydrate) [of](https://bowheart.github.io/zedux/docs/guides/mergingHierarchies) [cool](https://bowheart.github.io/zedux/docs/guides/zeroConfiguration) [stuff](https://bowheart.github.io/zedux/docs/guides/theProcessorLayer) [we](https://bowheart.github.io/zedux/docs/guides/configuringTheHierarchy) [haven't](https://bowheart.github.io/zedux/docs/guides/harnessingStateMachines) [covered](https://bowheart.github.io/zedux/docs/guides/storeComposition).

Here's a small taste of what's in store (hah):

## Zero configuration

Zedux stores are so dynamic, you can just create one and go. Zero config should feel just like using React's `useState` hook. In fact, use cases are very similar.

Here's what the above counter example looks like if we leverage zero configuration:

```ts
import { createStore } from 'zedux'

// In zero config mode, we typically hydrate the store initially
const store = createStore().hydrate(0) // set initial state to 0

// That's it!
store.setState(store.getState() + 1) // sets store state to 1
store.setState(store.getState() + 1) // sets store state to 2
```

Did you see that? Zedux state updates are fully synchronous. The second `getState()` call is able to access the new state. This is possible because Zedux does not have a middleware layer.

Now, if you're familiar with React's `useState` hook, you'll know there's a better way to update state based on a previous state:

```ts
import { createStore } from 'zedux'

const store = createStore().hydrate(0)

store.setState(state => state + 1) // sets store state to 1
store.setState(state => state + 1) // sets store state to 2
```

That's right, you can pass a function to `setState()` which will be called with the current state. But we just created the same function twice! Let's fix that:

```ts
const increment = state => state + 1

store.setState(increment)
store.setState(increment)
```

In Zedux, this is called the Inducer Pattern. Inducers are just state updater functions named like action creators but implemented like reducers. While often not needed, this pattern can help reduce complexity in larger zero-config stores.

You can give `setState()` a partial state object. Zedux deeply merges it into the rest of the state for you:

```ts
import { createStore } from 'zedux'

const store = createStore().hydrate({ a: { b: 1 }, c: 2 })

store.setState({ c: 3 })
// { a: { b: 1 }, c: 3 }
store.setState(state => ({ a: { b: state.a.b + 1 } }))
// { a: { b: 2 }, c: 3 }
```

Note that `store.hydrate()` does _not_ merge state:

```ts
store.hydrate({ c: 3 }) // { c: 3 } (oops)
```

> You may have noticed that the branch nodes of our state trees are all plain objects. But Zedux can actually be taught to understand any hierarchical data type. Immutable fans rejoice and check out the guide on [configuring the hierarchy](https://bowheart.github.io/zedux/docs/guides/configuringTheHierarchy).

### But what about time travel??

No worries! Zedux translates every pseudo-action into a serializable action that a store's [effect subscribers](FIXME) can plug in to. `store.hydrate()`, `store.setState()`, and actions dispatched to child stores will all find a way to notify a store's effect subscribers of a serializable action that can be used to reproduce the state update. In short, you never have to worry about whether a state update is reproducible; Zedux has you covered.

See:

- [`store.hydrate()`](https://bowheart.github.io/zedux/docs/api/Store#storehydrate)
- [the `Inducer` type](https://bowheart.github.io/zedux/docs/types/Inducer)
- [`store.setState()`](https://bowheart.github.io/zedux/docs/api/Store#storesetstate)
- [the zero configuration guide](https://bowheart.github.io/zedux/docs/guides/zeroConfiguration)

## Store composition

Too good to be true? Think again. The store composition model of Zedux is unprecedented and extremely powerful. The Zedux store's disposable and highly performant nature combined with its uncanny time traveling ability will make you weep. With joy, of course.

FIXME: Maybe examples here from the composition section of introduction.mdx (hmm, probably not tho).

See:

- [`createStore()`](https://bowheart.github.io/zedux/docs/api/createStore)
- [the `Store` api](https://bowheart.github.io/zedux/docs/api/Store)
- [the store composition guide](https://bowheart.github.io/zedux/docs/guides/storeComposition)

## Selectors

Zedux ships with a basic api for creating one of the most powerful state management performance tools: Memoized selectors. A selector is just a function with the form:

```ts
state => derivedState
```

In other words, it takes a state tree and plucks a piece off of it and/or applies some transformation to it. A memoized selector is a smart selector that only recalculates its value when absolutely necessary. When a recalculation is not necessary, it returns a cached value.

```ts
import { createSelector } from 'zedux'

/*
  A non-memoized selector - grabs the list of todos off the state tree.
*/
const selectTodos = state => state.entities.todos

/*
  This is a memoized selector.
  He consists of a list of input selectors and a calculator
  function. The calculator function's arguments are the outputs
  of the input selectors. The calculator function will only be
  called when BOTH the state and the output of one or more
  input selectors change.
*/
const selectIncompleteTodos = createSelector(selectTodos, todos =>
  todos.filter(todo => !todo.isComplete)
)
```

See:

- [`select()`](https://bowheart.github.io/zedux/docs/api/select)
- [the performance optimization guide](https://bowheart.github.io/zedux/docs/guides/optimizingPerformance)
- [the `Selector` type](https://bowheart.github.io/zedux/docs/types/Selector)

## State machines

Don't get too excited. But yes, state machines are very powerful and yes, Zedux includes a basic implementation.

A state machine is just a graph. The possible states are the nodes of the graph. The possible transitions between states are directed edges connecting the nodes.

```ts
import { createActor, createMachine } from 'zedux'

// Behold the states. A state is just an actor.
const open = createActor('open')
const closing = createActor('closing')
const closed = createActor('closed')
const opening = createActor('opening')

/*
  Once we have our states, we create the machine by defining
  how the machine transitions from one state to the next.

  A machine is just a fancy reducer.
*/
const doorMachine = createMachine(open) // set initial state
  .drawEdges(open, closing)
  .drawEdges(closing, [opening, closed])
  .drawEdges(opening, [closing, open])
  .drawEdges(closed, opening)

// Since our doorMachine is just a reducer, it's easy to test
doorMachine(open.type, closing()) // closing - valid transition
doorMachine(closing.type, open()) // closing - invalid transition
doorMachine(opening.type, open()) // open - valid transition
```

Zedux machines (and all Zedux reducers) can also be passed directly to React's `useReducer`. They don't have to be used in a Zedux store.

See:

- [`createMachine()`](https://bowheart.github.io/zedux/docs/api/createMachine)
- [the state machine guide](https://bowheart.github.io/zedux/docs/guides/harnessingStateMachines)
- [the `ZeduxMachine` api](https://bowheart.github.io/zedux/docs/api/ZeduxMachine)

## Conclusion

Zedux offers all the benefits of the global, singleton model, but also the isolation and reusability of component-bound (fractal) stores. It offers all the power of Redux' reducer-driven state updates and the lightweight simplicity of React's `useState` hook.

Zedux apps will be able to mix and match approaches, adapting to every stateful need with the appropriate amount of power and/or simplicity.

At this point you should have a pretty good idea of what Zedux is all about. Check out the [full documentation](https://bowheart.github.io/zedux/docs/overview) for the rest of the awesomeness.

## Official packages

- [React Zedux](https://github.com/bowheart/react-zedux) - Official React bindings for Zedux.
- [Zedux Immer](https://github.com/bowheart/zedux-immer) - Official Immer bindings for Zedux.

## Contributing

All contributions on any level are so overwhelmingly welcome. Just jump right in. Open an issue. For PRs, just use prettier like a human and keep tests at 100% (branches, functions, lines, everything 100%, plz). Let's make this awesome!

Bugs can be submitted to https://github.com/bowheart/zedux/issues

## License

The MIT License.
