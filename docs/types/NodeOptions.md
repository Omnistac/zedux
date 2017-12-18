# NodeOptions

## Definition

```typescript
interface NodeOptions<T = Object> {
  clone?: (node: T) => T
  create?: () => T
  get?: (node: T, key: string) => any
  set?: (node: T, key: string, val: any) => T
}
```

**clone** - A function that accepts a node and clones it. Does not need to deep copy the node's properties. In fact, it probably shouldn't.

**create** - Returns a new, empty node.

**get** - Takes a node and a key and returns the value of `key` in `node`.

**set** - Takes a node, a key, and a value. Sets the value of `key` in `node` to `value`. Returns the modified node. This can be mutating. Zedux promises to never abuse this power.

## Examples

Using the ImmutableJS `Map` class:

```javascript
import { createStore } from 'zedux'
import { Map } from 'immutable'

const nodeOptions = {
  clone: node => node,
  create: () => new Map(),
  get: (node, key) => node.get(key),
  set: (node, key, val) => node.set(key, val)
}

const counterReducer = (state = 0, action) => {
  const amount = action.type === increment.type

  return state + amount
}

const store = createStore()
  .setNodeOptions(options)
  .use({
    counter: counterReducer
  })

store.getState().get('counter') // 0
```
