# The Reducer Layer

The reducer layer is one of the 3 layers of a Zedux store.

When an action is dispatched to the store, the reducer layer is always the second layer hit &ndash; after the inspectors but before the processors.

The reducer layer's purpose is to turn actions into state. The reducer layer is a tree of composed [reducers](/docs/types/Reducer.md) and their sub-reducers. When an action is dispatched to a store, Zedux calls the store's "root" reducer to calculate the new state.

## Building the hierarchy

Let's build a hierarchy by hand &ndash; 'cause we're gonna pretend we like being old-school:

```javascript
// We'll take a couple sub-reducers...
const subReducers = {
  buy: (state, item) => [ ...state, item ]
  sell: (state, soldItem) => state.filter(item => item !== soldItem)
}

// ...and a reducer...
const potionsReducer = (state = [ 'health' ], action) =>
  subReducers[action.type]
    ? subReducers[action.type](state, action.payload)
    : state

// ...and a root reducer composed of our reducer
// Note that this reducer will return a new object every time
// it's called. This is not what we want, but for simplicity...
const rootReducer = (state = {}, action) => ({
  potions: potionsReducer(state.potions, action)
})
```

Well, that was certainly the definition of boilerplate. But we can see from this that a reducer hierarchy consists of:

- Branch nodes - Like the `rootReducer` in this example. The branch nodes in the hierarchy are reducers that take other reducers and create a single object (or whatever data type) whose properties are controlled by individual reducers.

- Leaf nodes - Like the `potionsReducer` in this example. These are reducers that control their own initial state and decide what to do for any given action. Leaf nodes aren't composed of any other reducers, though they may delegate to sub-reducers.

- Sub-reducers - These are reducers that typically handle exactly one action type. Sub-reducers don't define their initial state; they rely on their parent reducer to do that for them. As such, these aren't really part of the hierarchy at all, but an implementation detail of the reducers that delegate to them.

## Turning it up

Alright, so that was fun and educational. But we'll probably never do that by hand in Zedux. Let's turn up the awesomeness:

We'll start with the fun part. In Zedux, we `react` `to` action types `withReducers`:

```javascript
import { react } from 'zedux'

const potionsReactor = react([ 'health' ])
  .to('buy')
  .withReducers((state, { payload }) => [ ...state, payload ])

  .to('sell')
  .withReducers(
    (state, { payload }) => state.filter(item => item !== payload)
  )
```

Note that `react()` accepts the initial state as its only argument. It also returns a [reactor](/docs/types/Reactor.md). This is just a fancy reducer.

Now we just need to put it all together:

```javascript
const rootHierarchy = {
  potions: potionsReactor
}
```

Yep, in Zedux we don't need to reduce everything down to a root reducer. Zedux will handle the branch nodes for us. This `rootHierarchy` object is all ready to be passed in to [`store.use()`](/docs/api/Store.md#storeuse):

```javascript
import { createStore } from 'zedux'

const store = createStore()
  .use(rootHierarchy)
```

And we're done! Here's all of that together (and simplified a little bit) ... (and beefed up a little bit...):

```javascript
import { act, createStore, react } from 'zedux'

// This is how we'll typically create actors.
// An actor is just a fancy action creator.
const buy = act('buy')
const sell = act('sell')

const potionsReactor = react([ 'health' ])

  // The neat thing about actors is they can be passed directly to
  // this reactor's `.to()` method, avoiding string literals/constants:
  .to(buy)
  .withReducers((state, { payload }) => [ ...state, payload ])

  .to(sell)
  .withReducers(
    (state, { payload }) => state.filter(item => item !== payload)
  )

const store = createStore()
  .use({
    potions: potionsReactor
  })
```
