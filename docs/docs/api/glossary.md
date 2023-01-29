---
id: glossary
title: Glossary
---

### Dynamic Graph Dependency

When one [graph node](#graph-node) depends on another, Zedux draws an edge between those two nodes in its internal graph algorithm.

A "dynamic" dependency is a dependency that will trigger updates in the dependent node when the dependency node's state updates. Contrast this to [static dependencies](#static-graph-dependency), which do not trigger updates.

If the dependent is a React component, it will rerender when the dependency atom instance's state changes.

If the dependent is another atom instance, it will reevaluate when the dependency atom instance's state changes.

### Graph Edge

The edges between [graph nodes](#graph-node). These edges can have several properties, depending on how the edge was created and how it should behave.

Edges can be static or dynamic, internal or external, and async or synchronous. They can be identified by an "operation" string that helps when debugging.

### Graph Node

Zedux builds an internal graph to manage atom dependencies and propagate updates in an optimal way. There are two types of nodes in this graph:

- [Atom instances](classes/AtomInstance)
- [AtomSelectors](types/AtomSelector)
- External dependents (usually React components).

### Injector

Injectors are the "hooks" of Atoms. Zedux exports several injectors.

There are 3 basic types of injectors:

- React-hook equivalents, like [`injectEffect`](injectors/injectEffect), [`injectMemo`](injectors/injectMemo), and [`injectRef`](injectors/injectRef).
- Dependency injectors, like [`injectAtomValue`](injectors/injectAtomValue) and [`injectAtomInstance`](injectors/injectAtomInstance).
- Utility or dev X injectors, such as [`injectAtomGetters`](injectors/injectAtomGetters) and [`injectWhy`](injectors/injectWhy).

Injectors should only be used at the top level of [atom state factories](#state-factory). Don't use them in loops or conditional statements.

Injectors can be used any number of times throughout an atom state factory. For certain one-off operations like setting an atom instance's exports or setting a suspense promise, use an [AtomApi](classes/AtomApi).

Like hooks, you can create custom injectors that compose other injectors. The convention is to start all injectors with the word "inject", just like we use the word "use" with React hooks.

### Pseudo Action

An action created by Zedux to represent a state change. The key to time travel debugging is tracking all actions that modify state. But zero config stores typically use [`.setState()`](classes/Store#setstate) to update their state. Parent and child stores can also cause the state of a store to change.

Zedux translates all of these state updating operations into "pseudo-actions" - action objects with metadata containing all the info needed to reproduce the state change.

### State Factory

A function passed to [`atom()`](factories/atom) (or other atom factory functions like [`ion()`](factories/ion)). This function is called to produce the initial value of the atom instance. It also runs every time an atom instance reevaluates.

These are similar to render functions in React. Except of course they return state instead of UI.

### Static Graph Dependency

When one [graph node](#graph-node) depends on another, Zedux draws an edge between those two nodes in its internal graph algorithm.

A "static" dependency is a dependency that does not trigger updates in the dependent node when the dependency node's state updates. Contrast this to [dynamic dependencies](#dynamic-graph-dependency), which do trigger updates.

While they don't trigger updates, static dependencies are still useful for informing Zedux that an atom instance is in use. Zedux won't try to clean up atom instances that still have dependents.

### Unrestricted Injector

An [injector](#injector) whose use isn't restricted like normal injectors. An unrestricted injector still must be used inside an atom state factory (called synchronously during evaluation). However, unlike normal injectors, unrestricted injectors can be used in control flow statements (`if`, `for`, `while`) or after early returns.

You usually won't need to worry about this distinction. Just use them like normal injectors and you'll be fine.

Examples of unrestricted injectors include [`injectAtomGetters()`](injectors/injectAtomGetters), [`injectInvalidate()`](injectors/injectInvalidate), and [`injectWhy()`](injectors/injectWhy).
