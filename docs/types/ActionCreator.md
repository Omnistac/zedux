# ActionCreator

Essentially an action factory. An action creator is just a function that returns a valid [action](/docs/types/Action.md).

## Definition

```typescript
interface ActionCreator<T extends string> {
  (...args: any[]): Action<T>
}
```

**args** - You decide. There are no rules here.

## Notes

Action creators are just a common pattern from the Redux world. But in Zedux, we'll typically prefer to use [actors](/docs/types/Actor.md).
