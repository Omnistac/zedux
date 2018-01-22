# Configuring the Hierarchy

By default, the reactor hierarchy created by Zedux will return a JavaScript object for every [branch node](/docs/types/Branch.md) found in the hierarchy descriptor passed to the store. So:

```javascript
store.use({ // this object is a b node
  a: () => 1
})
```

creates a reactor hierarchy that'll return the following state:

```javascript
{
  a: 1
}
```

But what if we don't want an object? Say we want to enforce immutability in our store and use an immutable `Map` as the intermediate nodes. We could build our own reactor hierarchy from scratch, but then we might as well be using plain Redux. Here's where `store.setNodeOptions()` comes in.

## The gist

There are 7 functions that Zedux uses to work with state tree nodes:

1. `clone` - A function that accepts a node and returns a clone (shallow copy) of that node.

2. `create` - A function that returns a new, empty node.

3. `get` - A function that accepts a node and key and returns the value of `key` in `node`.

4. `isNode` - A function that accepts anything and returns a boolean indicating whether the given argument is a node.

5. `iterate` - A function that accepts a node and a callback function and iterates over all the key-value pairs, passing them to the callback function as `callback(key, value)`.

6. `set` - A function that accepts a node, a key, and a value and sets the value of `key` to `value` in `node`.

7. `size` - A function that accepts a node and returns its size &ndash; an integer representing the number of key-value pairs contained in the node.

The default value of all these is pretty straight-forward:

```javascript
const defaultNodeOptions = {
  clone: node => { ...node },

  create: () => ({}),

  get: (node, key) => node[key],

  isNode: isPlainObject, // (an internal helper function)

  iterate: (node, callback) => {

    // Iterate over the object's entries and pass each pair off
    // to the callback function
    Object.entries(node).forEach(
      ([ key, val ]) => callback(key, val)
    )
  },

  set: (node, key, val) => {
    node[key] = val

    return node
  },

  size: node => Object.keys(node).length
}
```

This is the stuff that tells Zedux how to work with plain objects as the intermediate nodes in the reactor hierarchy. But using `store.setNodeOptions()`, we can teach Zedux how to use something else.

## Implementing

Let's teach Zedux a new data type. We'll use the `Map` class from ImmutableJS for this example:

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

// A simple reducer for this example
const counterReducer = (state = 0, action) => {
  const amount = action.type === increment.type

  return state + amount
}

// And create the store
const store = createStore()
  .setNodeOptions(options)
  .use({
    counter: counterReducer
  })

// Now the root state tree node created by Zedux will be an Immutable map:
store.getState().get('counter') // 0
```

## Notes

There are probably no reasons for overwriting just one or two options. If you specify one node option, you should definitely specify them all.
