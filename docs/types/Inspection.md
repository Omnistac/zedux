# Inspection

The object returned from [`store.inspect()`](/docs/api/Store.md#storeinspect). An inspection object has a single `uninspect()` method used to stop listening for actions dispatched to the store.

## Definition

```typescript
interface Inspection {
  uninspect(): void
}
```

**uninspect** - A function used to unregister the inspector from the store.

## Notes

Inspections are created when registering [inspectors](/docs/types/Subscriber.md).
