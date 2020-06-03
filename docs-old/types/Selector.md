# Selector

A selector is a function used to compute state derivations. Selectors are often used as [adapters](/docs/glossary.md#adapter) that take a store's state object and pluck a piece off of it.

Selectors have many benefits:

- They are declarative - `selectHighestBid()`, `selectCurrentWeapon()`, etc...

- They are abstract - `selectTodos(state)` vs `state.entities.todos`.

- They compose well. Selectors can be used as input to other selectors.

- They can be memoized to prevent unnecessarily repeating heavy calculations. Zedux provides support for memoized selectors out of the box. See [the `select()` api](/docs/api/select.md).

Even small applications can benefit immensely from selectors. This is why they are included as part of Zedux core. 'Cause where would a complete state management tool be without them?

## Definition

```typescript
interface Selector<S = any, D = any> {
  (state: S, ...args: any[]): D
}
```

**state** - The current state of the store.

## Notes

The Zedux implementation of selectors is basically a stripped-down version of the excellent [reselect library](https://github.com/reactjs/reselect). However, Zedux doesn't implement everything. If you need any of the extra features provided by reselect, feel free to use it! Any existing Zedux selectors will port over nicely.
