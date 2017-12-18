# HierarchyDescriptor

A plain object that describes the store's reactor hierarchy. This is a high-level abstraction around creating a reactor hierarchy manually. Zedux will take this info and craft the reactor hierarchy for you.

[`store.use()`](/docs/api/Store.md#storeuse) is excellent at merging descriptors together. See the [merging hierarchies guide](/docs/guides/mergingHierarchies.md) for more info.

## Definition

```typescript
interface HierarchyDescriptor {
  [s: string]: HierarchyDescriptorNode
}
```

In other words, it's an object containing valid [hierarchy descriptor nodes](/docs/types/HierarchyDescriptorNode.md), including other hierarchy descriptors.

## Notes

While Zedux provides this abstraction for you, you can still piece together your own reactor hierarchies like in Redux. Just pass your root reactor to `store.use()`
