# Dispatchable Reducers

Zedux allows reducers to be dispatched directly to the store in place of actions. These reducers have the form:

```typescript
<S = any>(state: S) => S
```

Ah! But wait! Real reducers also take an `action` param:

```typescript
<S = any>(state: S, action: Action) => S
```

So let's get some terminology straight first. Dispatchable "reducers" are not reducers at all. In fact, they're really just a map function. We might call them "Mappers" then. But that's a little too generic. Since they're inspired by reducers and functionally similar, we will refer to them as "Inducers". That is what they do after all &ndash; induce state updates.

## Inducers

Read up on the pros and cons of inducers in the [zero configuration guide](/docs/guides/zeroConfiguration.md).

Inducers require a few techniques to meet their full potential. Let's go over the most important ones:

## Techniques

Let's look at a normal inducer first:

```javascript
const increment = (state = 0) => state + 1

store.dispatch(increment)
```

So this is nice and easy, but it isn't configurable, extensible, or scalable. Let's look at a few techniques we can use to make inducers awesome:

### Inducer factories

These are analogous to action creators. Note the currying:

```javascript
const addTodo = text =>
  (state = []) =>
    [ ...state, { text, isComplete: false } ]

store.dispatch(addTodo('take the road more traveled'))
```

### Shape abstraction

The real purpose of zero configuration is to allow small applications to take advantage of Zedux. But as your app scales, you should probably move to a [reducer hierarchy setup](/docs/guides/theReducerHierarchy).

Since reducers are [shape agnostic](/docs/glossary.md#shape-agnostic), it is important to abstract out the state boundedness of inducers as much as possible. This will make it easier to port the existing inducer "hierarchy" to a reducer hierarchy.

To do this, we'll make use of a shape abstraction called an [adapter](/docs/glossary.md#adapter).

```javascript
/*
  Here's our adapter.

  This guy just abstracts out the fact that the "todos" array
  lives inside a "todos" property on the root store object.
*/
const todosAdapter = inducer => (state = {}) => ({
  ...state,
  todos: inducer(state.todos)
})

/*
  Here's our normal inducer factory.

  This is the entity we may one day split into an action
  creator and real reducer.
*/
const addTodo = newTodo => todosAdapter(
  (state = []) => [ ...state, newTodo ]
)
```

### Composite inducers

Did you notice? Inducers have the form `State => State`. Oh, snap...Must...Compose. Use this technique to update multiple separate but dependent pieces of the state tree at once:

```javascript
import { compose } from 'zedux'
import { buyWeapon, spendGold } from './inducerFactories'
import { selectWeaponPrice } from './selectors'
import store from './store'

const buyAndSpend = compose(
  buyWeapon('broadsword'),
  spendGold(selectWeaponPrice('broadsword'))
)

store.dispatch(buyAndSpend)
```

## But inducers aren't serializable! What about time travel?

Actually, it's still possible. After calculating the new state, Zedux will dispatch the special [hydrate action](/docs/api/actionTypes.md#hydrate) to the store, which inspectors can plug in to.

This gives Zedux a big boost up from other zero-configuration Redux libraries like [Repatch](https://github.com/jaystack/repatch) and [Redux-Zero](https://github.com/concretesolutions/redux-zero).

## Refactoring

Eventually our app may grow to the point where we need the scalability of a [reducer hierarchy](/docs/guides/theReducerLayer.md). Well-made inducer hierarchies are very easy to incrementally migrate to a reducer hierarchy setup.

Let's take the `addTodo` inducer factory from our shape abstraction example above and port it over to a reducer hierarchy. Here it is again:

```javascript
const addTodo = newTodo => todosAdapter(
  (state = []) => [ ...state, newTodo ]
)
```

Let's create the action creator first:

```javascript
const addTodo = newTodo => ({
  type: 'addTodo',
  payload: newTodo
})
```

And the reducer:

```javascript
const addTodoReducer = (state = []) => [ ...state, newTodo ]
```

And that's really all there is to it! You can see how much of that was copy-paste. But the Zedux api makes this even easier. Here's a complete example using Zedux [actors](/docs/api/ZeduxActor.md) and [reactors](/docs/api/ZeduxReactor.md):

```javascript
import { act, createStore, react } from 'zedux'

const addTodo = act('addTodo')

const addTodoReactor = react([])
  .to(addTodo)
  .withReducers((state = []) => [ ...state, newTodo ])

const store = createStore()
  .use({
    todos: addTodoReactor
  })
```

And that's everything. In 8 lines of code, we made an action creator, reactor, reducer, store, and reactor hierarchy and wired them all together.
