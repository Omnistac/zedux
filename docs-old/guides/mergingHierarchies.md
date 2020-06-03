# Merging Hierarchies

"What happens if I merge x into y?"

There are many different scenarios that we can run into when merging two [hierarchy descriptors](/docs/types/HierarchyDescriptor.md) together via [`store.use()`](/docs/api/Store.md#storeuse). This comprehensive guide will cover all of them.

## The nodes

There are 4 types of hierarchy descriptors &ndash; the branch type and 3 types of leaves:

- Branch - This is the branch node in the tree. It's just a plain object containing other nodes. See the [Branch type documentation](/docs/types/Branch.md).

- Reactor - A leaf node. See the [Reactor type documentation](/docs/types/Reactor.md).

- Store - A leaf node. See the [Store documentation](/docs/api/Store.md).

- null - A leaf node. Indicates a not-yet-created node or a node that should be removed.

## The scenarios

We'll use the notation `x -> y` to mean "merge a node of type `x` into a node of type `y`."

Given our 4 node types, we have the following merge scenarios:

```
1. null -> null
2. null -> Branch
3. null -> Reactor
4. null -> Store

5. Branch -> null
6. Branch -> Branch
7. Branch -> Reactor
8. Branch -> Store

9. Reactor -> null
10. Reactor -> Branch
11. Reactor -> Reactor
12. Reactor -> Store

13. Store -> null
14. Store -> Branch
15. Store -> Reactor
16. Store -> Store
```

Any node in the hierarchy, including the root, may be any of these 4 types, and thus can encounter any of these 16 scenarios.

It may seem like a lot, but it's really pretty straightforward. Just remember the rules.

## The rules

1. Type 6 (`Branch -> Branch`) recursively merges the two nodes.

2. Everything else **always** overwrites the given node (if it exists).

  - The `null -> *` scenarios remove the given node.
  - The `* -> null` scenarios create a node.

See? Not so difficult.

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

  // Branch -> Store
  .use({ // overwrites the root node
    a: aReactor // creates a node
  })

  // Branch -> Branch
  .use({ // is recursively merged into the root node
    a: { // overwrites the "a" node
      b: bStore // creates a node
    },
    c: cReactor // creates a node
  })

  // Branch -> Branch
  .use({ // is recursively merged into the root node

    // Reactor -> Branch
    a: aReactor // overwrites the "a" node

    // Branch -> Reactor
    c: { // overwrites the "c" node
      d: { // creates a node
        e: eStore // creates a node
      }
    },

    // Reactor -> null
    f: fReactor // creates a node
  })

  // Branch -> Branch
  .use({ // is recursively merged into the root node

    // Branch -> Branch
    c: { // is recursively merged into the "c" node

      // Store -> Branch
      d: dStore // overwrites the "c.d" node
    },

    // null -> Reactor
    f: null // deletes the "f" node
  })
```

Here's our hierarchy's final shape:

```javascript
{
  a: aReactor,
  c: {
    d: dStore
  }
}
```

## Notes

Don't get hierarchy descriptors and the resulting reactor hierarchy confused! Here we've been talking about hierarchy descriptors. Zedux will take the hierarchy descriptor passed to `store.use()`, merge it with the existing hierarchy descriptor (if any), then create a reactor hierarchy with that information.

Zedux builds the reactor hierarchy using a special, internally-created intermediate reactor for every Branch node found.

The data type returned by the intermediate reactors can be changed with the [`store.setNodeOptions()`](/docs/guides/configuringTheHierarchy.md) api. However, a plain object is always used in the hierarchy descriptor passed to `store.use()`.
