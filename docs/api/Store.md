# Store

A Zedux store is just a collection of functions. Conceptually, a store is a predictable state container that enforces unidirectional data flow. The store's state can only be updated by dispatching [actions](/docs/types/Action.md) to it.

Zedux stores are completely synchronous. This means that when an action is dispatched to the store, the action is immediately sent through the [reducer layer](/docs/guides/theReducerLayer.md), which calculates the new state and returns it directly to the dispatch caller.

Zedux stores are composable. A Zedux store is a valid node in another store's [hierarchy descriptor](/docs/types/HierarchyDescriptor.md).

Zedux stores are created with the [`createStore()` factory](/docs/api/createStore.md).

## Method API

### `store.dispatch()`

Dispatches an [action](/docs/types/Action.md) to the store and returns the new state. Dispatched actions can be canceled by inspectors, but the current state (modified or not) will always be returned.

#### Definition

```typescript
(dispatchable: Dispatchable) => any
```

**dispatchable** - Either an [Action](/docs/types/Action.md) or an [Inducer](/docs/types/Inducer.md). See the [Dispatchable type doc](/docs/types/Dispatchable.md).

#### Examples

Dispatching a normal action:

```javascript
import { createStore } from 'zedux'

const store = createStore()
  .use((state = '', action) => action.payload || state)

const newState = store.dispatch({
  type: 'test',
  payload: 'new state'
})

newState // 'new state'
```

Dispatching an [inducer](/docs/types/Inducer.md):

```javascript
import { createStore } from 'zedux'

const store = createStore()

const newState = store.dispatch(
  (state = '') => 'new state'
)

newState // 'new state'
```

### `store.getState()`

Retrieves the current state of the store. **Do not mutate this value**.

#### Definition

```typescript
() => any
```

#### Examples

```javascript
import { createStore } from 'zedux'

const store = createStore()
  .hydrate('initial state')

store.getState() // 'initial state'
```

### `store.hydrate()`

Hydrates the store with the given data.

Completely replaces any existing state tree with whatever is passed.

Internally, this just causes the special [hydrate](/docs/api/actionTypes.md#hydrate) action to be dispatched to the store.

Note that this won't do any checking to make sure the new state shape is compatible with the current reducer hierarchy. That's your job.

#### Definition

```typescript
(newState: any) => Store
```

**newState** - The state to force upon the store.

Returns the store for chaining.

#### Examples

```javascript
import { createStore } from 'zedux'

const store = createStore()
  .hydrate({ weapon: 'dagger' })

store.getState() // { weapon: 'dagger' }

// Whereas `setState()` merges the partial state update into
// the existing state...
store.setState({ helmet: 'iron' }) /* ->
  {
    weapon: 'dagger',
    helmet: 'iron'
  }
*/

// ...`hydrate()` replaces the state tree entirely:
store.hydrate({ helmet: 'bronze' })
store.getState() // { helmet: 'bronze' }
```

### `store.inspect()`

Registers a new [inspector](/docs/types/Inspector.md). Unlike subscribers, inspectors are expected to stick around for the store's entire life. As such, there is currently no way to unregister an inspector. But if you find a use case for that, we'd be happy to hear it!

#### Definition

```typescript
(inspector: Inspector) => Store
```

**inspector** - The [inspector](/docs/types/Inspector.md) to register with the store.

#### Examples

A simple logger:

```javascript
import { createStore } from 'zedux'

const store = createStore()
  .inspect(logger)

function logger(storeBase, action) {
  console.log('action received:', action)
}

store.dispatch({
  type: 'useAntidote'
}) // logs "action received: { type: 'useAntidote' }"
```

### `store.setNodeOptions()`

Sets the [node options](/docs/types/NodeOptions.md) that the intermediate nodes in the reducer hierarchy will use to output the state tree.

#### Definition

```typescript
(options: NodeOptions) => Store
```

**options** - A hash of [node options](/docs/types/NodeOptions.md) that teach Zedux how to use the new data type.

Returns the store for chaining.

#### Examples

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

### `store.setState()`

Applies a partial state update to the store. The partial state tree will be merged into the existing state tree (immutably, of course).

Will also trigger the special [PARTIAL_HYDRATE](/docs/api/actionTypes.md#partialhydrate) action which the store's inspectors can plug in to in order to implement time travel debugging, etc.

This is the king of the zero-configuration model of Zedux. Very small apps may want to use this method often and will find extreme joy in its ease of use. Large apps may want to avoid it entirely, sticking to a more pure, Redux-y approach. But that's entirely up to you. You're welcome.

#### Definition

```typescript
(partialUpdate: any) => S
```

**partialUpdate** - The partial state update to merge into the existing state. Does not have to clone the root node or any nested nodes in the state tree. Zedux takes care of that.

Returns the new state of the store.

#### Examples

```javascript
import { createStore } from 'zedux'

const store = createStore()
  .hydrate({
    equipment: {
      helmet: 'iron helm',
      weapon: 'broadsword'
    },
    health: 22
  })

const newState = store.setState({
  equipment: { weapon: 'crossbow' }
})

newState /* ->
  {
    equipment: {
      helmet: 'iron helm',
      weapon: 'crossbow'
    },
    health: 22
  }
*/
```

Notice that `store.hydrate()` returns the store for chaining, while `store.setState()` returns the new state of the tree. This illustrates the different use cases &ndash; `store.hydrate()` is for setting the initial state of the store or fully wiping/recreating it. `store.setState()` is for on-the-fly state updates.

### `store.subscribe()`

Registers a subscriber with the store. The subscriber will be notified when the store's state changes.

#### Definition

```typescript
(subscriber: Subscriber) => Subscription
```

**subscriber** - A [subscriber function](/docs/types/Subscriber) that will be passed the previous and new state when the state changes.

Returns a [subscription](/docs/types/Subscription.md). The subscription's `unsubscribe()` method can be used to unregister the subscriber from the store.

#### Examples

```javascript
import { createStore } from 'zedux'

const store = createStore()

store.subscribe((prevState, newState) => {
  console.log('state changed from', prevState, 'to', newState)
})

store.dispatch(
  () => 'new state'
) // logs "state changed from undefined to new state"
```

### `store.use()`

The code splitting wizard of the Zedux realm. Creates or modifies the [reactor hierarchy](/docs/types/Reactor.md) using the [configured node options](#storesetnodeoptions) and the passed [hierarchy descriptor](/docs/types/HierarchyDescriptor.md).

After the reactor hierarchy has been modified, it dispatches a special recalculate action to the store.

#### Definition

```typescript
(newHierarchy: HierarchyDescriptorNode) => Store
```

**newHierarchy** - The new [hierarchy descriptor node](/docs/types/HierarchyDescriptorNode). Will be recursively merged into the existing hierarchy or create it if it doesn't exist.

#### Examples

```javascript
import { createStore } from 'zedux'

const store = createStore()
  .use({
    cart: cartStore,
    entities: {
      apparel: apparelReactor,
    }
  })

// Oh! They went to the "toys" page of our SPA.
// Load up the "toys" reducer and add it to the store.
store.use({
  entities: {
    toys: toysReducer // yeah, a normal reducer for fun.
  }
})
```

This will give us a hierarchy that looks like:

```javascript
{
  cart: cartStore,
  entities: {
    apparel: apparelReactor,
    toys: toysReducer
  }
}
```

Note that while Zedux provides this abstraction for you, you can still piece together your own reactor hierarchies like in Redux. Just pass your root reactor to `store.use()`.

See the [merging hierarchies](/docs/guides/mergingHierarchies.md) guide for a more in-depth rundown.

## Notes

A Zedux store also contains a special `$$typeof` symbol that identifies it internally. This is mostly just important when passing a store as part of a [hierarchy descriptor](/docs/types/HierarchyDescriptor.md). Zedux won't recognize the store without this property.
