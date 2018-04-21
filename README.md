# Zedux

[![Build Status](https://travis-ci.org/bowheart/zedux.svg?branch=master)](https://travis-ci.org/bowheart/zedux)
[![Test Coverage](https://api.codeclimate.com/v1/badges/0459ebf8444c36752eac/test_coverage)](https://codeclimate.com/github/bowheart/zedux/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/0459ebf8444c36752eac/maintainability)](https://codeclimate.com/github/bowheart/zedux/maintainability)
[![npm](https://img.shields.io/npm/v/zedux.svg)](https://www.npmjs.com/package/zedux)

The complete state management solution. Zedux is a futuristic Redux.

<div style="text-align: center">
  ![Store Composition and Higher-Order Stores](https://bowheart.github.io/zedux/docs/img/intro.png)
</div>

## Feature list of awesomeness

- [composable stores](https://bowheart.github.io/zedux/docs/guides/storeComposition) &ndash; Yep, for real. Enter the Higher-Order Store revolution!
- [built-in side effects model](https://bowheart.github.io/zedux/docs/guides/theProcessorLayer) &ndash; Thunks, generators, and observables out-of-the-box.
- [reducer-driven state updates](https://bowheart.github.io/zedux/docs/guides/theReducerLayer) &ndash; Redux-style power. Optional, of course.
- [state machines](https://bowheart.github.io/zedux/docs/guides/harnessingStateMachines)
- [code splitting](https://bowheart.github.io/zedux/docs/api/Store#storeuse)
- [zero-configuration](https://bowheart.github.io/zedux/docs/guides/zeroConfiguration) &ndash; Opinionated but configurable.
- [memoized selectors](https://bowheart.github.io/zedux/docs/api/select)

## Installation

Install using npm:

```bash
npm install --save zedux
```

Or yarn:

```bash
yarn add zedux
```

Or include the appropriate unpkg build on your page (module exposed as `Zedux`):

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

To learn comprehensively, check out the [tests](https://github.com/bowheart/zedux/tree/master/test).

Or keep reading for a brief run-down:

## Intro

- composition > middleware

This is the core philosophy of Zedux. Zedux takes Redux and dips it in React's composable architecture to achieve stateful zen.

- Opinionated but configurable.

Simplicity rules. Zedux stores require zero configuration to start. But they're flexible and powerful enough to move with you as your app's state demands increase. Apps of all sizes, from tiny to gigantic, should be able to use Zedux comfortably.

- Building blocks of state

The store is the basic building block of application state. Stateful components that expose a Zedux store can be easily consumed and composed in any application. Zedux stores can also be easily synced across realms (workers, browser extensions, iframes, SSR).

Composition is king.

## Quick start

At the most basic level, Zedux is still Redux. A reducer hierarchy drives state creation and updates. Let's get some code:

```javascript
import { act, createStore, react } from 'zedux'

/*
  Meet your first Zedux store.
  He's a fast, composable, predictable state container.
  And the best part is that he's all ready to go.
*/
const store = createStore()

/*
  These are actors.
  An actor is just a function that returns an action.
  An action is just a plain object with a "type" property.
  Actions are how we tell the store to update.

  (For Redux peoples): An actor is just a fancy action creator.
*/
const increment = act('increment')
const decrement = act('decrement')

/*
  This is a reactor (in Zedux we emphasize the act-react
  relationship between actions and reducers).
  A reactor is just a fancy reducer.
  A reducer is just a pure function with the signature:
    (state, action) => state

  This reactor translates the "increment" and "decrement"
  actions into a corresponding state update by delegating
  to sub-reducers.
  A sub-reducer is just a reducer that doesn't control its
  initial state and is only called for specific actions.
*/
const counterReactor = react(0) // 0 - the initial state
  .to(increment)
  .withReducers(state => state + 1)

  .to(decrement)
  .withReducers(state => state - 1)

/*
  So we said the store is all ready to go. And that's true.
  But in Zedux, zero configuration is optional <fireworks here>.
  We're not gonna use it here. But check it out in the docs.

  Here we're introducing our reactor hierarchy to Zedux.
  In this example it's a very simple one, but `store.use()`
  actually accepts complex objects containing reactors, stores,
  and nested objects containing reactors, stores, and...you
  get the picture.
*/
store.use(counterReactor)

/*
  Here we're subscribing to the store.
  Zedux calls this function every time the store's state changes.
*/
store.subscribe((oldState, newState) => {
  console.log(`counter went from ${oldState} to ${newState}`)
})

/*
  Alright! Let's take this thing for a spin!
  We will do said spin by dispatching actions to the store.
*/
store.dispatch(increment())
// counter went from 0 to 1
store.dispatch(increment())
// counter went from 1 to 2
store.dispatch(decrement())
// counter went from 2 to 1
```

If you know Redux, almost all of this will seem familiar (and not just because the Redux docs have a similar example). At this point, you should know enough to get started using Zedux. But don't worry, there's [a](https://bowheart.github.io/zedux/docs/guides/reactUsage) [ton](https://bowheart.github.io/zedux/docs/api/Store#storehydrate) [of](https://bowheart.github.io/zedux/docs/guides/mergingHierarchies) [cool](https://bowheart.github.io/zedux/docs/guides/zeroConfiguration) [stuff](https://bowheart.github.io/zedux/docs/guides/theProcessorLayer) [we](https://bowheart.github.io/zedux/docs/guides/configuringTheHierarchy) [haven't](https://bowheart.github.io/zedux/docs/guides/harnessingStateMachines) [covered](https://bowheart.github.io/zedux/docs/guides/storeComposition).

Here's a small taste of what's in store (yes, that pun was an accident):

### Zero configuration

Zedux stores are so dynamic, you can just create one and go. Here's what the above counter example looks like if we leverage zero configuration:

```javascript
import { createStore } from 'zedux'

/*
  We use `store.hydrate()` to force-update the store's
  entire state tree:
*/
const store = createStore()
  .hydrate(0) // set the initial state to 0

/*
  These are inducers.
  Inducers are like reducers (hence the name), but have the form:
    state => partialStateUpdate

  Inducers are dispatchable - they can be passed directly to
  `store.dispatch()`
*/
const increment = state => state + 1
const decrement = state => state - 1

/*
  And that's it! The fun starts now.
*/
store.dispatch(increment)
store.dispatch(decrement)

/*
  Inducers are super easy to create on the fly...
*/
store.dispatch(state => state + 6)

/*
  ...but in this case we'll typically want to use `store.setState()`
*/
store.setState(9)
```

Dispatching an inducer and calling `store.setState()` are functionally similar, but have different use cases. Inducers are nice for creating predefined state updater packages. `store.setState()` is nice for on-the-fly state updates &ndash; use cases are similar to React's [`setState()`](https://reactjs.org/docs/react-component.html#setstate).

The advantage of using inducers and `store.setState()` over `store.hydrate()` is that the new state is deeply merged into the existing state. Thus headaches like:

```javascript
store.hydrate({
  ...state,
  todos: {
    ...state.todos,
    urgent
  }
})
```

become simple:

```javascript
store.setState({
  todos: { urgent }
})

// or, with an inducer:
store.dispatch(() => ({
  todos: { urgent }
}))
```

since Zedux clones the nested nodes for us.

> You may have noticed that the branch nodes of our state trees are all plain objects. But Zedux can actually be taught to understand any hierarchical data type. Immutable fans rejoice and check out the guide on [configuring the hierarchy](https://bowheart.github.io/zedux/docs/guides/configuringTheHierarchy).

#### But what about time travel??

Ooh. You're gonna love this. Zedux translates every pseudo-action into a serializable action that a store's [inspectors](https://bowheart.github.io/zedux/docs/types/Inspector) can plug in to. `store.hydrate()`, `store.setState()`, and actions/inducers dispatched to child stores will all find a way to notify a store's inspectors of a serializable action that can be used to reproduce the state update. In short, you never have to worry about whether a state update is reproducible. Zedux has you covered.

See:

- [`store.hydrate()`](https://bowheart.github.io/zedux/docs/api/Store#storehydrate)
- [the `Inducer` type](https://bowheart.github.io/zedux/docs/types/Inducer)
- [`store.setState()`](https://bowheart.github.io/zedux/docs/api/Store#storesetstate)
- [the zero configuration guide](https://bowheart.github.io/zedux/docs/guides/zeroConfiguration)

### Store composition

Too good to be true? Think again. The store composition model of Zedux is unprecedented and extremely powerful. The Zedux store's disposable and highly performant nature combined with its uncanny time traveling ability will make you weep. With joy, of course.

```javascript
import { act, createStore, react } from 'zedux'

/*
  While a Zedux app can have many stores, we'll typically always
  create a single "root" store. This gives us the best of both
  worlds - The time traveling ability of the singleton model
  and the encapsulation of component-bound stores.
*/
const rootStore = createStore()

// A basic inducer
const increment = state => state + 1

let storeIdCounter = 1

/*
  A simple factory for creating a "counter" store and attaching
  it to the root store's reactor hierarchy.
*/
const createCounterStore = () => {
  const storeId = storeIdCounter++

  const counterStore = createStore()
    .hydrate(0)

  // Where the magic happens; tell rootStore to "use" counterStore
  rootStore.use({ [`counter${storeId}`]: counterStore })

  return counterStore
}

// And enjoy
const counter1 = createCounterStore()
const counter2 = createCounterStore()

// We can increment each counter individually...
counter1.dispatch(increment)
counter1.dispatch(increment)

counter2.dispatch(increment)

// ...or the whole lot of 'em:
rootStore.dispatch(increment)

rootStore.getState() // { counter1: 3, counter2: 2 }
```

Treating the store as the basic application building block opens the door for embedded applications. The Zedux store is an autonomous unit that can simultaneously handle a sub-module's internal workings and present a standardized api to consumers.

Additionally, the ability to create stores whose lifecycle parallels the lifecycle of a component while still maintaining time-traversable state and replayable actions is an exciting new possibility that Zedux has blown wide open.

See:

- [`createStore()`](https://bowheart.github.io/zedux/docs/api/createStore)
- [the `Store` api](https://bowheart.github.io/zedux/docs/api/Store)
- [the store composition guide](https://bowheart.github.io/zedux/docs/guides/storeComposition)

### Selectors

Zedux ships with a basic api for creating one of the most powerful state management performance tools: Memoized selectors. A selector is just a function with the form:

```javascript
state => derivedState
```

In other words, it takes a state tree and plucks a piece off of it and/or applies some transformation to it. A memoized selector is a smart selector that only recalculates its value when absolutely necessary. When a recalculation is not necessary, it returns a cached value.

```javascript
import { select } from 'zedux'

/*
  This is a normal selector.
  He just grabs the list of todos off the state tree.
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
const selectIncompleteTodos = select(
  selectTodos,
  todos => todos.filter(todo => !todo.isComplete)
)
```

Selectors are an absolutely necessary ingredient for well-managed state. Use them. Use them all the time. Memoized selectors carry some overhead, so only use them when the performance benefit is obvious &ndash; e.g. when iterating over a list.

See:

- [`select()`](https://bowheart.github.io/zedux/docs/api/select)
- [the performance optimization guide](https://bowheart.github.io/zedux/docs/guides/optimizingPerformance)
- [the `Selector` type](https://bowheart.github.io/zedux/docs/types/Selector)

### State machines

Don't get too excited. But yes, state machines are very powerful and yes, Zedux includes a basic implementation.

A state machine is just a graph. The possible states are the nodes of the graph. The possible transitions between states are directed edges connecting the nodes.

```javascript
import { state, transition } from 'zedux'

/*
  Behold the states.
  A state is just a fancy actor.
*/
const open = state('open')
const closing = state('closing')
const closed = state('closed')
const opening = state('opening')

/*
  Once we have our states, we create the machine by defining
  how the machine transitions from one state to the next.

  A machine is just a fancy reactor.
*/
const doorMachine = transition(open)
  .to(closing)
  .to(opening, closed)

  .from(opening)
  .to(closing, open)

  .from(closed)
  .to(opening)

/*
  Since our doorMachine is just a very fancy reducer,
  it's super easy to test (and just have a blast with).
*/
doorMachine(open.type, closing()) // closing - valid transition
doorMachine(closing.type, open()) // closing - invalid transition
doorMachine(opening.type, open()) // open - valid transition
```

See:

- [`state()`](https://bowheart.github.io/zedux/docs/api/state)
- [`transition()`](https://bowheart.github.io/zedux/docs/api/transition)
- [the state machine guide](https://bowheart.github.io/zedux/docs/guides/harnessingStateMachines)
- [the `ZeduxMachine` api](https://bowheart.github.io/zedux/docs/api/ZeduxMachine)

### To be continued...

At this point you should have a pretty good idea of what Zedux is all about. Check out the [full documentation](https://bowheart.github.io/zedux/docs/overview) for the rest of the awesomeness.

## Official packages

- [React Zedux](https://github.com/bowheart/react-zedux) - Official React bindings for Zedux.
- [Zedux Immer](https://github.com/bowheart/zedux-immer) - Official Immer bindings for Zedux.

## It seems too big

Mm. It really isn't. You may think this because Redux is so tiny. But compare it to something like [Rx](https://github.com/reactivex/rxjs), which is a complete solution in its field, and Zedux is very tiny. Currently it's almost twice the size of Redux, but accomplishes way more than twice as much. In fact, given the reduced number of plugins, your app's dependencies will almost certainly be smaller with Zedux than with Redux.

That said, if we find that anything is not used enough to make it worth including in Zedux core, we'll definitely take it out. On the flip side, if any features are sorely needed and not included, we'll gladly consider including them. Zedux has only a faint coat of feature-creep repellent.

## Contributing

All contributions on any level are so overwhelmingly welcome. Just jump right in. Open an issue. PRs, just keep the coding style consistent and the tests at 100% (branches, functions, lines, everything 100%, plz). Let's make this awesome!

Bugs can be submitted to https://github.com/bowheart/zedux/issues

## License

The MIT License.
