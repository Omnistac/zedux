---
id: glossary
title: Glossary
---

### Dynamic Graph Dependency

When one [graph node](#graphnode) depends on another, Zedux draws an edge between those two nodes in its internal graph algorithm.

A "dynamic" dependency is a dependency that will trigger updates in the dependent node when the dependency node's state updates. Contrast this to [static dependencies](#staticgraphdependency), which do not trigger updates.

If the dependent is a React component, it will rerender when the dependency atom instance's state changes.

If the dependent is another atom instance, it will reevaluate when the dependency atom instance's state changes.

### Evaluator

A function passed to [the `atom()` factory](factories/atom). This function is called to produce the initial value of the atom instance. It also runs every time an atom instance is evaluated.

### Graph Node

Zedux builds an internal graph to manage atom dependencies and propagate updates in an optimal way. There are two types of nodes in this graph:

- [Atom instances](classes/AtomInstance)
- External dependents (usually React components).

### Injector

Injectors are the "hooks" of Atoms. Zedux exports several injectors.

Some injectors are React-hook equivalents, like [injectEffect](injectors/injectEffect), [injectMemo](injectors/injectMemo), and [injectRef](injectors/injectRef).

Others provide certain utilities or debugging capabilities, such as [injectEcosystem](injectors/injectEcosystem) and [injectWhy](injectors/injectWhy).

Injectors should only be used at the top level of [atom evaluator functions](#evaluator). Don't use them in loops or conditional statements.

Injectors can be used any number of times throughout an atom evaluator. For certain one-off operations like setting an atom instance's exports or setting a suspense promise, use an [AtomApi](classes/AtomApi).

Like hooks, you can create custom injectors. The convention is to start all injectors with the word "inject", just like we use the word "use" with React hooks.

### Static Graph Dependency

When one [graph node](#graphnode) depends on another, Zedux draws an edge between those two nodes in its internal graph algorithm.

A "static" dependency is a dependency that does not trigger updates in the dependent node when the dependency node's state updates. Contrast this to [dynamic dependencies](#dynamicgraphdependency), which do trigger updates.
