# Inducer

An inducer is *almost* a [reducer](/docs/types/Reducer.md) &ndash; the differences being:

1. Inducers don't take an `action` param.

2. Inducers return a partial state update, not necessarily the full state tree. This partial state update will be merged into the existing state tree.

Inducers are so named because their job is to "induce" state updates in the store.

Inducers are [dispatchable](/docs/types/Dispatchable.md).

## Definition

```typescript
interface Inducer<S = any, P = any> {
  (state: S): P
}
```

**state** - Zedux will pass dispatched inducers the current state of the store.

## Notes

Inducers are the key to most [zero configuration setups](/docs/guides/zeroConfiguration.md).

Inducers require a few techniques to meet their full potential. Read up on those in the [dispatchable reducers guide](/docs/guides/dispatchableReducers.md#techniques).
