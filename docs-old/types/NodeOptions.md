# NodeOptions

The object passed to [`store.setNodeOptions()`](/docs/api/Store.md#storesetnodeoptions). All properties are optional.

## Definition

```typescript
interface NodeOptions<T = Object> {
  clone?: (node: T) => T
  create?: () => T
  get?: (node: T, key: string) => any
  isNode?: (thing: any) => boolean
  iterate?: (node: T, callback: (key: string, val: any) => void) => void
  set?: (node: T, key: string, val: any) => T
  size?: (node: T) => Number
}
```

**clone** - A function that accepts a node and clones it. Does not need to deep copy the node's properties. In fact, it probably shouldn't.

**create** - Returns a new, empty node.

**get** - Takes a node and a key and returns the value of `key` in `node`.

**isNode** - Takes anything and returns a boolean indicating whether the given thing is a node.

**iterate** - Takes a node and a callback function. The node's key-value pairs should be iterated over and passed to `callback` as `callback(key, value)`.

**set** - Takes a node, a key, and a value. Sets the value of `key` in `node` to `value`. Returns the modified node. This can be mutating. Zedux promises to never abuse this power.

**size** - Takes a node and returns its size &ndash; an integer representing the number of key-value pairs contained in the node.

## Examples

Using the ImmutableJS `Map` class:

```javascript
import { createStore } from 'zedux'
import { Map } from 'immutable'

const nodeOptions = {
  clone: node => node,

  create: () => new Map(),

  get: (node, key) => node.get(key),

  isNode: node => node instanceof Map,

  iterate: (node, callback) => {
    node.forEach(
      (val, key) => callback(key, val)
    )
  },

  set: (node, key, val) => node.set(key, val),

  size: node => node.size
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

// Now the root state tree node created by Zedux will be an Immutable map:
store.getState().get('counter') // 0
```
