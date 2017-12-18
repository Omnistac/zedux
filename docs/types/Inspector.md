# Inspector

An inspector is a function that "inspects" the store. Inspectors will be called every time an action is dispatched to the store. They perform tasks like logging and recording actions &ndash; e.g. for time travel debugging.

Zedux takes special care to make sure that a store's inspectors are called every time the store's state will change. So [`store.hydrate()`](/docs/api/Store.md#storehydrate), [inducers](/docs/types/Inducer.md), and actions dispatched to child stores will all find a way to notify the store's inspectors of the action causing the state update.

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
