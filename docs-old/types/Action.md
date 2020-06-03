# Action

An action is a plain object containing a `type` property and optional `payload` property. While `type` is required, `payload` is optional and can be replaced with whatever standard you wish.

## Definition

```typescript
interface Action<T extends string> {
  type: T
  payload?: any
}
```

**type** - Some string that identifies this action. Avoid using names starting with `'@@zedux/'` as these are reserved for internal Zedux action types.
**payload** - optional - Literally anything. Just a standard.

## Notes

Normally you'll want to write [action creators](/docs/types/ActionCreator.md) rather than chalking up full action objects all over the place.
