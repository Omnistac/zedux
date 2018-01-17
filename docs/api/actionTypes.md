# `actionTypes`

There are a few action types that Zedux uses internally. While there should never be any reason for you to use these types, you may see them show up in your inspectors. They are listed here for your information.

## Properties

### `HYDRATE`

Zedux dispatches this action when the store's [`.hydrate()`](/docs/api/Store.md#storehydrate) method is called.

The hydrate action's `payload` property will be the value of the new state. Thus a store's [inspectors](/docs/types/Inspector.md) can be notified of otherwise unserializable "actions". The idea here is that dispatching an hydrate action is **exactly** equivalent to calling `store.hydrate()`.

For example, dispatching the following inducer:

```javascript
store.dispatch(() => 'new state')
```

is exactly equivalent to dispatching the following hydrate action:

```javascript
store.dispatch({
  type: '@@zedux/hydrate',
  payload: 'new state'
})
```

In short, this action makes time travel possible even when using `store.hydrate()`.

#### Usage

```javascript
import { actionTypes } from 'zedux'

const { HYDRATE } = actionTypes
```

### `PARTIAL_HYDRATE`

Zedux dispatches this action in two scenarios:

1. When the store's [`setState()`](/docs/api/Store.md#setstate) method is called.

2. When an [inducer](/docs/types/Inducer.md) is dispatched to the store.

Behavior is very similar to the [HYDRATE action](#hydrate). The only difference being that the PARTIAL_HYDRATE action's `payload` is a partial state update that should be merged into the existing state, whereas a HYDRATE action's payload replaces the state entirely.

In short, this action makes time travel possible even when using inducers and `store.setState()`.

### `RECALCULATE`

Zedux dispatches this action to the store when the store's reactor hierarchy is changed via [`store.use()`](/docs/api/Store.md#storeuse). As such, this is the action that typically calculates the initial state of the store.

#### Usage

```javascript
import { actionTypes } from 'zedux'

const { RECALCULATE } = actionTypes
```
