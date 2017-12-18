# Configuring the Hierarchy

By default, the reactor hierarchy created by Zedux will return a JavaScript object for every ReactorHierarchy node found in the hierarchy descriptor. So:

```javascript
store.use({ // this object is a ReactorHierarchy node
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

There are 4 functions that define the node creation process.

1. `clone` - A function that accepts a node and returns a clone (shallow copy) of that node.

2. `create` - A function that returns a new, empty node.

3. `get` - A function that accepts a node and key and returns the value of `key` in `node`.

4. `set` - A function that accepts a node, a key, and a value and sets the value of `key` to `value` in `node`.

The default value of all these is pretty straight-forward:

```javascript
const defaultNodeOptions = {
  clone: node => { ...node },
  create: () => ({}),
  get: (node, key) => node[key],
  set: (node, key, val) => (node[key] = val, node)
}
```

(Yeah, that's a comma expression. So shoot me.)

This is the stuff that tells Zedux how to work with plain objects as the intermediate nodes in the reactor hierarchy. But using `store.setNodeOptions()`, we can teach Zedux how to use something else. Let's take the `Map` class from ImmutableJS for example:

```javascript
import { createStore } from 'zedux'
import { Map } from 'immutable'

const nodeOptions = {
  clone: node => node,
  create: () => new Map(),
  get: (node, key) => node.get(key),
  set: (node, key, val) => node.set(key, val)
}

const store = createStore()
  .setNodeOptions(options)
```

## Notes

There are probably no reasons for overwriting just one or two options. If you specify one node option, you should definitely specify them all.

If you are wanting to use ImmutableJS, consider the `zedux-immutable` plugin. It exports a higher-order store creator that'll create pre-configured stores for you.

```javascript
import { createImmutableStore } from 'zedux-immutable'

const store = createImmutableStore()
  .use(...)
  // etc...
```
