# StoreBase

This is the piece of a [store](/docs/api/Store.md) that is passed to [inspectors](/docs/types/Inspector.md). A store's StoreBase is just an object containing a subset of the store's methods.

## Definition

```typescript
interface StoreBase<S = any> {
  dispatch(dispatchable: Dispatchable): S
  getState(): S
}
```

**dispatch** - The store's dispatch method. See [`Store.dispatch()`](/docs/api/Store.md#storedispatch).

**getState** - The store's getState method. See [`Store.getState()`](/docs/api/Store.md#storegetstate).

## Motivation

The StoreBase contains all the functionality an inspector should need. If you find yourself wanting another store method in an inspector, it's a good sign that you're doing something wrong.

That said, if you find a good use case for another store method inside an inspector, [let us know!](https://github.com/bowheart/zedux/issues)
