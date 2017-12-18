# HierarchyDescriptorNode

This is the parameter passed to [`store.use()`](/docs/api/Store.md#storeuse). Typically this will be a [hierarchy descriptor](/docs/types/HierarchyDescriptor.md) composed of other hierarchy descriptor nodes.

## Definition

```typescript
type HierarchyDescriptorNode = HierarchyDescriptor | Store | Reactor | null
```

A hierarchy descriptor node can be a [hierarchy descriptor](/docs/types/HierarchyDescriptor.md), a [store](/docs/api/Store.md), a [reactor](/docs/types/Reactor.md), or `null` (which indicates a node that should be deleted).

## Notes

While Zedux provides this abstraction for you, you can still piece together your own reactor hierarchies like in Redux. Just pass your root reactor to `store.use()`
