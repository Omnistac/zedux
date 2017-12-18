# Subscription

The object returned from [`store.subscribe()`](/docs/api/Store.md#storesubscribe). A subscription object has a single `unsubscribe()` method used to stop listening for changes to the store.

## Definition

```typescript
interface Subscription {
  unsubscribe(): void
}
```

**unsubscribe** - A function used to unsubscribe from receiving notifications of state updates.

## Notes

Subscriptions are created when registering [subscribers](/docs/types/Subscriber.md).
