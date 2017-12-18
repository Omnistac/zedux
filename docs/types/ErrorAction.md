# ErrorAction

This type adds one property to the [action interface](/docs/types/Action.md): `isError` - a boolean that must always be true.

## Definition

```typescript
interface ErrorAction extends Action {
  error: true
}
```

## Notes

Error actions will normally be created with [`zeduxActor.error()`](/docs/api/ZeduxActor.md#zeduxactorerror).
