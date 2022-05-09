# Zedux

[![Build Status](https://travis-ci.org/bowheart/zedux.svg?branch=master)](https://travis-ci.org/bowheart/zedux)
[![Test Coverage](https://api.codeclimate.com/v1/badges/0459ebf8444c36752eac/test_coverage)](https://codeclimate.com/github/bowheart/zedux/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/0459ebf8444c36752eac/maintainability)](https://codeclimate.com/github/bowheart/zedux/maintainability)
[![npm](https://img.shields.io/npm/v/zedux.svg)](https://www.npmjs.com/package/zedux)

A Molecular State Engine for React.

Zedux features a powerful composable store model wrapped in an atomic architecture. State management doesn't have to be hard to be amazing.

## Feature list of awesomeness

- Atomic architecture
- Composable stores
- Zero configuration
- State machines
- Cache management
- Built-in side effects model
- Action streams
- Code splitting
- Memoization

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

To learn by example, check out the [examples doc page](https://Omnistac.github.io/zedux/docs/examples) or the [examples in the repo](https://github.com/bowheart/zedux/tree/master/examples).

To learn by getting dirty, have a play with [this codepen](https://codepen.io/bowheart/pen/MrKMmw?editors=0010).

To learn like a boss, check out the [tests](https://github.com/bowheart/zedux/tree/master/test).

Or keep reading for a brief run-down:

## Intro

- **Flexible**

The core philosophy of Zedux. **Zedux apps can have many stores** and should. Each store is flexible, meaning it can adapt to its use case. Need more power? Build a reducer hierarchy. Need some simple, local state? Use zero config stores.

Apps of all sizes should be able to use Zedux comfortably.

- **Composable**

Zedux takes Redux and dips it in React's composable architecture. Stores are composable, which means a store can control some or all of the state of another store. Stores therefore become building blocks of application state. Stateful components that expose a Zedux store can be simultaneously isolated and easily consumed/composed in any application.

- **Opinionated but Configurable**

Simplicity rules. Zedux stores require zero configuration to start. But they're flexible and powerful enough to move with you as your app's state demands increase. Zedux offers high-level apis for speed and simplicity, but also offers low-level escape hatches for everything.

## Quick start

> This guide will assume basic knowledge of Redux, such as how to use reducers and the importance of immutability.

At the most basic level, Zedux is still Redux. A reducer hierarchy drives state creation and updates.

```ts
import { createActor, createReducer, createStore } from 'zedux'

/*
  Meet your first Zedux store.
  He's a fast, composable, predictable state container.
  And the best part: He's all ready to go.
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
const counterReducer = createReducer(0) // 0 - the initial state
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

If you know Redux, almost all of this will seem familiar. At this point, you should know enough to get started using Zedux. But don't worry, there's a ton of cool stuff we haven't covered.

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

You may have noticed here that Zedux state updates are fully synchronous. The second `getState()` call is able to access the new state after the first `setState()` runs. This is possible because Zedux does not have a middleware layer.

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

> You may have noticed that the branch nodes of our state trees are all plain objects. But Zedux can actually be taught to understand any hierarchical data type. Immutable fans rejoice and check out the guide on [configuring the hierarchy](https://Omnistac.github.io/zedux/docs/guides/configuringTheHierarchy).

### But what about time travel??

No worries! Zedux translates every pseudo-action into a serializable action that a store's effect subscribers can plug in to. `store.hydrate()`, `store.setState()`, `store.use()`, and actions dispatched to child stores will all find a way to notify a store's effect subscribers of a serializable action that can be used to reproduce the state update. In short, you never have to worry about whether a state update is reproducible; Zedux has you covered.

## Store composition

Too good to be true? Think again. The store composition model of Zedux is unprecedented and extremely powerful. The Zedux store's disposable and highly performant nature combined with its uncanny time traveling ability will make you weep. With joy, of course.

```ts
import { createStore } from 'zedux'

const childStore = creatStore().hydrate('child state!')
const parentStore = createStore({
  child: childStore,
})

parentStore.getState()
// { child: 'child state!' }
```

Zedux keeps the child's state in sync with the parent. Every time the child's state changes, the parent's state changes. Actions dispatched to the parent store are forwarded on to all its child stores. Calling `setState()` and `hydrate()` on the parent store can also reach in to its child stores and update them.

## State machines

Don't get too excited. But yes, state machines are very powerful and yes, Zedux includes a basic implementation.

A state machine is just a graph. The possible states are the nodes of the graph. The possible transitions between states are directed edges connecting the nodes.

```ts
import { createActor, createMachine } from 'zedux'

// Define some actions that will transition the machine
const press = createActor('press')
const timer = createActor('timer')

/*
  Once we have our states, we create the machine by defining
  how the machine transitions from one state to the next.

  A machine is just a fancy reducer.
*/
const doorMachine = createMachine('open') // set initial state
  .addTransition('open', press, 'closing')
  .addTransition('closing', press, 'opening')
  .addTransition('closing', timer, 'closed')
  .addTransition('closed', press, 'opening')
  .addTransition('opening', press, 'closing')
  .addTransition('opening', timer, 'open')

// Since doorMachine is a reducer, it's easy to test
doorMachine(open.type, closing()) // closing - valid transition
doorMachine(closing.type, open()) // closing - invalid transition
doorMachine(opening.type, open()) // open - valid transition
```

Zedux machines (and all Zedux reducers) can also be passed directly to React's `useReducer`. They don't have to be used in a Zedux store.

## Conclusion

Zedux offers all the benefits of the global, singleton model, but also the isolation and reusability of component-bound (fractal) stores. It offers all the power of Redux' reducer-driven state updates and the lightweight simplicity of React's `useState` hook.

Zedux apps will be able to mix and match approaches, adapting to every stateful need with the appropriate amount of power and/or simplicity.

The composable nature of Zedux makes it especially useful in feature-based, micro-frontend, or otherwise code-split architectures.

At this point you should have a pretty good idea of what Zedux is all about. Check out the [full documentation](https://Omnistac.github.io/zedux/docs/getting-started/quick-start) for the rest of the awesomeness.

## Official packages

- [React Zedux](https://github.com/bowheart/react-zedux) - Official React bindings for Zedux.
- [Zedux Immer](https://github.com/bowheart/zedux-immer) - Official Immer bindings for Zedux.

## Contributing

All contributions on any level are so overwhelmingly welcome. Just jump right in. Open an issue. For PRs, just use prettier like a human and keep tests at 100% (branches, functions, lines, everything 100%, plz). Let's make this awesome!

Bugs can be submitted to https://github.com/bowheart/zedux/issues

## License

The MIT License.
