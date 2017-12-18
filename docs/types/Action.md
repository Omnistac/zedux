# Action

An action is a plain object containing a `type` property and optional `payload` property. While this interface can be extended, as it is with [`ErrorAction`s](/docs/types/ErrorAction.md), actions should never contain `metaType`, `metaPayload`, or `action` properties, as these are reserved for [meta nodes](/docs/types/MetaNode.md).

## Definition

```typescript
interface Action {
  type: string
  payload?: any
}
```

**type** - Some string that identifies this action. Avoid using names starting with `'@@zedux/'` as these are reserved for internal Zedux action types.

## Notes

Normally you'll want to write [action creators](/docs/types/ActionCreator.md) rather than chalking up full action objects all over the place.
