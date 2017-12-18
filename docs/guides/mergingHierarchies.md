# Merging Hierarchies

"What happens if I merge x into y?"

There are many different scenarios that we can run into when merging two hierarchies together via [`store.use()`](/docs/api/Store.md#storeuse). This comprehensive guide will cover all of them.

## The nodes

The reactor hierarchy, or tree, has 4 types of nodes&ndash;the branch type and 3 types of leaves:

- HierarchyDescriptor - This is the branch node in the tree. It's just a plain object containing other nodes.

- Reactor - A leaf node. See the [Reactor type documentation](/docs/types/Reactor.md)

- Store - A leaf node. See the [Store documentation](/docs/api/Store.md).

- null - A leaf node. Indicates a not-yet-created node or a node that should be removed.

## The scenarios

We'll use the notation `x -> y` to mean "merge a node of type `x` into a node of type `y`."

Given our 4 node types, we have the following merge scenarios:

```
1. null -> null
2. null -> HierarchyDescriptor
3. null -> Reactor
4. null -> Store

5. HierarchyDescriptor -> null
6. HierarchyDescriptor -> HierarchyDescriptor
7. HierarchyDescriptor -> Reactor
8. HierarchyDescriptor -> Store

9. Reactor -> null
10. Reactor -> HierarchyDescriptor
11. Reactor -> Reactor
12. Reactor -> Store

13. Store -> null
14. Store -> HierarchyDescriptor
15. Store -> Reactor
16. Store -> Store
```

Any node in the hierarchy, including the root, may be any of these 4 types, and thus can encounter any of these 16 scenarios.

It may seem like a lot, but it's really pretty straightforward. Just remember the rules.

## The rules

1. Types 1-4 (`null -> *`) remove the given node from the hierarchy.

2. Types 5, 9, and 13 (`* -> null`) create a node.

3. Type 6 (`HierarchyDescriptor -> HierarchyDescriptor`) recursively merges the two nodes.

4. The last 8 scenarios **always** overwrite the given node.

## Examples

```javascript
import { createStore } from 'zedux'

const store = createStore()

  // Reactor -> null
  .use(aReactor) // creates the root node

  // Reactor -> Reactor
  .use(newReactor) // overwrites the root node

  // Store -> Reactor
  .use(aStore) // overwrites the root node

  // Store -> Store
  .use(anotherStore) // overwrites the root node

  // HierarchyDescriptor -> Store
  .use({ // overwrites the root node
    a: aReactor // creates a node
  })

  // HierarchyDescriptor -> HierarchyDescriptor
  .use({ // is recursively merged into the root node
    a: { // overwrites the "a" node
      b: bStore // creates a node
    },
    c: cReactor // creates a node
  })

  // HierarchyDescriptor -> HierarchyDescriptor
  .use({ // is recursively merged into the root node

    // Reactor -> HierarchyDescriptor
    a: aReactor // overwrites the "a" node

    // HierarchyDescriptor -> Reactor
    c: { // overwrites the "c" node
      d: { // creates a node
        e: eStore // creates a node
      }
    }
  })

  // HierarchyDescriptor -> HierarchyDescriptor
  .use({ // is recursively merged into the root node

    // HierarchyDescriptor -> HierarchyDescriptor
    c: { // is recursively merged into the "c" node

      // Store -> HierarchyDescriptor
      d: dStore // overwrites the "c.d" node
    }
  })
```

## Notes

Don't get hierarchy descriptors and the resulting reactor hierarchy confused! Here we've been talking about hierarchy descriptors. Zedux will take the hierarchy descriptor passed to `store.use()`, merge it with the existing hierarchy descriptor (if any), then create a reactor hierarchy with that information.

Zedux builds the reactor hierarchy using a special, internally-created intermediate reactor for every HierarchyDescriptor node found.

The data type returned by the intermediate reactors can be changed with the [`store.setNodeOptions()`](/docs/guides/configuringTheHierarchy.md) api. However, a plain object is always used in the hierarchy descriptor passed to `store.use()`.
