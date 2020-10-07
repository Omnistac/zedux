# HierarchyDescriptor

This is the parameter passed to [`store.use()`](/docs/api/Store.md#storeuse). Typically this will be a [branch node](/docs/types/Branch.md) composed of other hierarchy descriptors.

## Definition

```typescript
type HierarchyDescriptor = Branch | Reactor | Store | null
```

A hierarchy descriptor can be a [branch](/docs/types/Branch.md), a [reactor](/docs/types/Reactor.md), a [store](/docs/api/Store.md), or `null` (which indicates a node that should be deleted).

## Examples

```javascript
import { createStore } from 'zedux'

const store = createStore()
  .use({ // a branch node - creates the hierarchy
    a: aReactor // a reactor node
  })
  .use(aStore) // a store node - replaces the existing hierarchy
  .use(null) // a null node - deletes the existing hierarchy
  .use(aReactor) // a reactor node - recreates the hierarchy
  .use({ // a branch node - replaces the existing hierarchy
    a: {
      b: aReactor
    },
    c: aStore
  })
  .use({ // a branch node - merged into the existing hierarchy
    a: { // a branch node - merged into `hierarchy.a`
      d: aReactor // a reactor node
    }
  })
```

At the end of all that, the store's hierarchy descriptor will look like:

```javascript
{
  a: {
    b: aReactor,
    d: aReactor
  },
  c: aStore
}
```

## Notes

While Zedux provides this abstraction for you, you can still piece together your own reactor hierarchies like in Redux. Just pass your root reactor to `store.use()`
