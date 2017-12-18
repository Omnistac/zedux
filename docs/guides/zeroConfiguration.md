# Zero Configuration

For small applications, Zedux offers the possibility of zero configuration. This makes it easy to get started using Zedux. There are two main features that contribute to zero configuration:

- The fact that [createStore](/docs/api/createStore.md) takes no arguments:

```javascript
import { createStore } from 'zedux'

const store = createStore()
```

- [dispatchable reducers](/docs/guides/dispatchableReducers.md) (we call these "inducers"):

```javascript
const addTodo = newTodo => (state = []) => [ ...state, newTodo ]

const newTodo = {
  text: 'configure nothing and get away with it',
  isComplete: false
}

store.dispatch(addTodo(newTodo))
```

## Pros

- Easy to get started.

- Very little typing.

- Easy to reason about for small applications.

- Since inducers cause the special "hydrate" action to be dispatched, we can still get a reproducible state tree e.g. for time travel debugging.

- They are much, much more efficient. To update one tiny corner of state, a reducer hierarchy must traverse the whole tree &ndash; O(n) (can be linearly mitigated by higher-order reducers like redux-ignore). Inducers, however, pluck the piece they need and update just that &ndash; O(1).

## Cons

- Not as declarative as a normal reducer hierarchy.

- Inducers are [shape bound](/docs/glossary.md#shape-bound), whereas reducers are [shape agnostic](/docs/glossary.md#shape-agnostic).

- More room for error.

- Requires either complex or composite inducers to mimic many-to-many actions-to-reducers mappings.

- Relying solely on inducers to update the state tree can become tedious to maintain and reason about in larger applications.
