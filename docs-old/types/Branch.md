# Branch

A plain object that describes the store's reactor hierarchy. This is a high-level abstraction around creating a reactor hierarchy manually. Zedux will take this info and craft the reactor hierarchy for you.

[`store.use()`](/docs/api/Store.md#storeuse) is excellent at merging branches together. See the [merging hierarchies guide](/docs/guides/mergingHierarchies.md) for more info.

## Definition

```typescript
interface Branch {
  [s: string]: HierarchyDescriptor
}
```

In other words, it's an object containing valid [hierarchy descriptors](/docs/types/HierarchyDescriptor.md), including other branch nodes.

## Examples

```javascript
import { createStore } from 'zedux'

const hierarchyDescriptor = { // a branch node
  a: { // another branch node
    b: aReactor // a reactor node
  },
  c: aStore // a store node
}

const store = createStore()
  .use(hierarchyDescriptor)
```

## Notes

While Zedux provides this abstraction for you, you can still piece together your own reactor hierarchies like in Redux. Just pass your root reactor to `store.use()`
