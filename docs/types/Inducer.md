# Inducer

An inducer is *almost* a [reducer](/docs/types/Reducer.md) &ndash; the only difference being that inducers don't take an `action` param. Inducers are, therefore, just a map function; they take the current state and map it to the new state.

Inducers are so named because their job is to "induce" state updates in the store.

Inducers are [dispatchable](/docs/types/Dispatchable.md).

## Definition

```typescript
interface Inducer<S = any> {
  (state: S): S
}
```

**state** - Zedux will pass dispatched inducers the current state of the store.

## Notes

Inducers are the key to a [zero configuration setup](/docs/guides/zeroConfiguration.md).

Inducers require a few techniques to meet their full potential. Read up on those in the [dispatchable reducers guide](/docs/guides/dispatchableReducers.md#techniques).
