# The Inspector Layer

The inspector layer is one of the 3 layers of a Zedux store. The inspector and [processor](/docs/guides/theProcessorLayer.md) layers are the pieces of Zedux that replace middleware in Redux.

The inspector layer consists of a store's registered [inspectors](/docs/types/Inspector.md).

When an action is dispatched to the store, the inspector layer is always the first layer hit, before reducers and processors.

## Purpose

The inspector layer is part of the side effects model of Zedux. It's used for logging and recording actions &ndash; e.g. for time travel debugging. It's useful for performing application-wide side effects like user session recording.

Typically, only the root store will have inspectors.

Since inspectors are [shape bound](/docs/glossary.md#shape-bound), they can perform shape-dependent tasks that the processor layer cannot. Processors receive their own local state, but there are cases where a processor might depend on a piece of state somewhere else in the state tree. In these cases, an inspector can be used as a shape bound "processor" of sorts.

## The gist

The inspector layer will be hit for every action and internal pseudo-action that could possibly change the state of the store. This includes [hydration](/docs/api/Store.md#storehydrate), [induction](/docs/guides/dispatchableReducers.md), [code splitting](/docs/api/Store.md#storeuse), [normal action dispatches](/docs/api/Store.md#storedispatch), and actions/pseudo-actions dispatched to child stores.

The goal of Zedux regarding the inspector layer is to ensure that it receives all the information necessary to re-create the store's entire state tree, including the state of all child stores.

## Examples

```javascript
import { createStore } from 'zedux'

const childStore = createStore()
const parentStore = createStore()

  // Register a basic logger inspector with the parent store
  .inspect((storeBase, action) => console.log(action))

parentStore.hydrate('b')
// { type: '@@zedux/hydrate', payload: 'b' }

parentStore.use(childStore)
// { type: '@@zedux/recalculate' }

childStore.dispatch(() => 'c')
/*
  {
    metaType: '@@zedux/delegate',
    metaPayload: [],
    action: { type: '@@zedux/hydrate', payload: 'c' }
  }
*/

childStore.dispatch({
  type: 'cool-action',
  payload: 'd'
})
/*
  {
    metaType: '@@zedux/delegate',
    metaPayload: [],
    action: { type: 'cool-action', payload: 'd' }
  }
*/
```

## Notes

Inspectors typically won't respond to specific actions. That's the processor's job. Check out the [processor layer guide](/docs/guides/theProcessorLayer.md) for that awesomeness.
