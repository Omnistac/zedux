# Inspector

An inspector is a function that "inspects" the store's actions. Inspectors are called every time an action is dispatched to the store. They perform tasks like logging and recording actions &ndash; e.g. for time travel debugging.

Zedux takes special care to make sure that a store's inspectors are called every time the store's state may change. So [`store.hydrate()`](/docs/api/Store.md#storehydrate), [`store.setState()`](/docs/api/Store.md#storesetstate), [inducers](/docs/types/Inducer.md), and actions dispatched to child stores will all find a way to notify the store's inspectors of a serializable action that can be used to reproduce the state update (#timetravel).

## Definition

```typescript
interface Inspector {
  (storeBase: StoreBase, action: MetaChainNode): void
}
```

**storeBase** - The [StoreBase](/docs/types/StoreBase.md) of the store.

**action** - A [MetaChainNode](/docs/types/MetaChainNode.md) containing the dispatched action.

## Notes

Read up on how the store interacts with the inspector layer in [the inspector layer guide](/docs/guides/theInspectorLayer.md).
