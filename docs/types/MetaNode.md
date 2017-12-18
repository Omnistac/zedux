# MetaNode

A meta node is a node in a meta chain that defines meta data for the action it wraps. There are a few [built-in meta types](/docs/api/metaTypes.md), but you can use custom types as well.

## Definition

```typescript
interface MetaNode {
  metaType: string,
  metaPayload?: any,
  action: MetaChainNode
}
```

**metaType** - Some string that identifies this meta node. Analogous to the `type` property of [actions](/docs/types/Action.md). Avoid using names starting with `'@@zedux/'` as these are reserved for internal Zedux meta types.

**metaPayload** - Optional - Can be literally anything.

**action** - The next node in the chain. So named because the last node in the chain must be an [action](/docs/types/Action.md) object. All meta nodes therefore effectively "wrap" the action in meta data.

## Notes
