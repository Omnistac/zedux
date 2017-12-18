# Reducer

A reducer is a pure function that accepts the current state and an action and returns the new state. Reducers are usually composed together to form reducer hierarchies. While this is really not too hard to put together manually, Zedux stores have a [`use()`](/docs/api/Store.md#storeuse) method to facilitate this.

## Definition

```typescript
interface Reducer<S = any> {
  (state: S | undefined, action: Action): S
}
```

**state** - The current state of the store, or piece of the state controlled by this reducer.

**action** - The current action being shuttled through the store's reducer layer.

## Notes

Read up on reducers in [the reducer layer guide](/docs/guides/theReducerLayer.md).
