# MetaChainNode

A meta chain node is just a node in a [meta chain](/docs/guides/metaChains.md). The last node in the chain must be a normal [action object](/docs/types/Action.md). All other nodes in the chain (if any) must be [meta nodes](/docs/types/MetaNode.md).

## Definition

```typescript
type MetaChainNode = MetaNode | Action
```

## Notes

See the [Action](/docs/types/Action.md) and [MetaNode](/docs/types/MetaNode.md) types.
