# Optimizing Performance

Zedux ships with 4 main methods of performance optimization.

## Memoized selectors

[Memoized selectors](/docs/api/select.md) are awesome performance tools. They prevent heavy calculations from being performed unless absolutely necessary.

Note that memoized selectors carry a little bit of overhead. But selectors are declarative and they're also a state shape abstraction. These benefits alone make the overhead of memoization almost never worth worrying about.

## Store composition

In Zedux, a store can be composed of other stores. An action dispatched to a store will:

- Hit the inspector, reducer, and processor layers of that store and all its child stores.

- Hit the inspector layer of its parent store (and its parent and its parent's parent, etc...).

- Completely ignore all sibling, cousin, uncle, and aunt stores.

This means that given the following store hierarchy:

```
    A  <-  The parent store
   / \
  B   C  <-  The child stores
```

dispatching an action to store `C` will not affect store `B` in the slightest and will only touch the inspector layer (which is usually the smallest layer) of store `A`.

A well-structured store hierarchy will naturally be very performant.

## Inducers

> Don't use this method as a performance optimization unless you're positive you need it. #prematureoptimization.

[Inducers](/docs/types/Inducer.md) have the unique capability of updating any piece of the store in O(1) time. A normal action dispatched to the store is passed through the entire reducer hierarchy to calculate the new state. While this is almost never a big deal, it is an O(n) algorithm.

Inducers can be used to circumvent the reducer hierarchy in most situations. Use sparingly.

Note that this optimization is only possible in stores that are not composed of other stores. When a store is composed of another store, Zedux still passes the special [hydrate action](/docs/api/actionTypes.md#hydrate) through the reducer layer in order to persist the inducer's imposed state to child stores. Of course, a store will eventually be reached that has no child stores. That store will still update in O(1) time.

## The SKIP_* meta types

> Don't use this method as a performance optimization unless you're positive you need it. #prematureoptimization.

Zedux has two special [meta types](/docs/api/metaTypes.md) that it uses internally but can technically be accessed. [`metaTypes.SKIP_REDUCERS`](/docs/api/metaTypes.md#skip_reducers) and [`metaTypes.SKIP_PROCESSORS`](/docs/api/metaTypes.md#skip_processors) can be used to skip the store's reducer and processor layers, respectively. These will also skip the reducer or processor layers of any child stores.

These should almost never be necessary. And they will obviously cause confusing bugs if used incorrectly. Use sparingly.
