# Zero Configuration

For small applications, Zedux offers the possibility of zero configuration. This makes it easy to get started using Zedux.

Let's look at the most basic Zedux store:

```javascript
import { createStore } from 'zedux'

const goldStore = createStore()

goldStore.setState(200)
goldStore.setState(130)
```

**Easy?** Oh, definitely.

**Unidirectional? Reproducible? Time-traversable?** Actually, still yes. Zedux is pretty cool like that.

**Scalable? Standardized? Maintainable?** Not so much.

In this guide, we'll explore just how truly zero-configured you want your Zedux app to be. We'll start off looking at the features of Zedux that contribute to zero configuration. Then we'll explore a few different design patterns surrounding them.

## Meet the players

The following Zedux features make zero configuration possible:

- [`createStore()`](/docs/api/createStore.md). The almighty Zedux store factory takes no arguments. Just create and go.

```javascript
import { createStore } from 'zedux'

const store = createStore()
```

- [`store.hydrate()`](/docs/api/Store.md#hydrate). In a zero-configuration app, there isn't typically one single "owner" of each piece of state like there is in a reducer hierarchy. Thus we'll typically explicitly hydrate the store with its entire initial state tree right when we create it.

```javascript
import { createStore } from 'zedux'

const store = createStore()
  .hydrate({
    entities: {
      todos: {
        '1': { id: 1, text: 'never look back', isComplete: true }
      }
    }
  })
```

- [`store.setState()`](/docs/api/Store.md#storesetstate). Don't let the word `set` confuse you. This is still unidirectional data flow at its finest. `store.setState()` enables indulgently easy on-the-fly state updates that are still reproducible (#timetravel).

```javascript
import { createStore } from 'zedux'

const store = createStore()
  .hydrate({
    entities: {
      todos: {}
    }
  })

store.setState({
  entities: {
    todos: {
      '1': { id: 1, text: 'get up and stretch', isComplete: false }
    }
  }
})
```

- [inducers](/docs/types/Inducer.md). While `store.setState()` is easy and fun, it isn't very scalable. All but the smallest apps will want to avoid it in most cases. Inducers are a much more scalable design pattern that allows us to create pre-packaged, standard "state updater" packages.

```javascript
import { createStore } from 'zedux'

const store = createStore()
  .hydrate(0)

const increment = state => state + 1
const decrement = state => state - 1

store.dispatch(increment) // 1
store.dispatch(increment) // 2
store.dispatch(decrement) // 1
```

## Patterns

Zedux allows for many possible state management design patterns. Which you should choose roughly correlates to the size of your application:

- **~tiny** &ndash; `store.setState()`.
- **~small** &ndash; Inducers with `store.setState()` when appropriate.
- **~small-medium** &ndash; Inducers FTW.
- **~medium** &ndash; Reducer hierarchy with inducers when appropriate.
- **~medium-large** &ndash; Reducer hierarchy with separate stores branching off and state machines where appropriate.
- **~large** &ndash; Store hierarchy, each store using a reducer hierarchy.

These can all be mixed and matched according to your taste and fancy. The awesomeness here is that it is very easy to incrementally migrate a codebase from one pattern to another. Zedux stores, with their time traveling and async handling, will work in all possible scenarios.

## Scenarios

These patterns are not set in stone. For example, even tiny applications may want to take advantage of multiple, composed stores. Since size is not the only factor, let's explore some scenarios where you may want to use a specific pattern.

### Dynamic state

When a state property can be literally anything, `store.setState()` can be useful even in very large applications:

```javascript
function handleInput(event) {
  store.setState({
    forms: {
      billingInfo: {
        firstName: event.currentTarget.value
      }
    }
  })
}
```

`store.setState()` can be used instead of reducers whose whose only job is to set the state to `action.payload`. The obvious downside is the risk of typos.  We can easily use [inducer factories](/docs/guides/dispatchableReducers.md#inducer-factories) to mitigate this:

```javascript
const setFirstName = firstName => state => ({
  forms: {
    billingInfo: { firstName }
  }
})

function handleInput(event) {
  store.dispatch(setFirstName(event.currentTarget.value))
}
```

This is typically the advantage of using inducers over `store.setState()`; they create a standard, reusable entry point for updating the state.

### Fixed state

When a state property can only take a fixed set of values, [`state()`](/docs/api/state.md) can be useful for enumerating those values:

```javascript
import { state } from 'zedux'

const asleep = state('asleep')
const offline = state('offline')
const online = state('online')
```

While [States](/docs/types/State.md) are meant to be used in state machines, inducers can use them too:

```javascript
const sleep = state => asleep.type
const goOffline = state => offline.type
const goOnline = state => online.type
```

This way, migrating to a reducer hierarchy later is a piece of cake:

```javascript
import { transition } from 'zedux'

const userStatusMachine = transition(asleep)
  .undirected(asleep, offline, online)
```

### Isolated state

Even small applications will often find pieces of state that are totally isolated from the rest of the application. Isolated stores handle isolated state just beautifully. App size aside. A form is the glaring example here:

```javascript
import { createStore } from 'zedux'
import { rootStore } from './store'

const formStore = createStore()
  .hydrate({
    firstName: ''
  })

// Not necessary, but we usually try to register all stores
// with the root store (e.g. for time travel):
rootStore.use({ form: formStore })

// A simple event listener for a fun and complete example:
document.getElementById('firstName')
  .addEventListener('input', ({ currentTarget: { value }}) => {
    formStore.setState({ firstName: value })
  })
```

It is usually fine for isolated stores to use a zero configuration setup even in very large applications.

## The initial state

In a classic reducer hierarchy, each reducer is in complete control of its state. But with zero configuration setups, we don't have that advantage. Inducers are very similar to sub-reducers in this regard. Compare:

```javascript
import { act, react } from 'zedux'

const increment = act('increment')

const counterReactor = react(0)
  .to(increment)
  .withReducers(state => state + 1)
```

vs.

```javascript
const increment = state => state + 1
```

With the `counterReactor`, we defined the initial state as `0`. The `increment` sub-reducer does not control its initial state. Notice that the `increment` inducer is *exactly* the same as the `increment` sub-reducer. As such, the inducer also does not control its initial state.

The solutions to this are:

1) We could just make inducers control their initial state:

```javascript
const increment = (state = 0) => state + 1
const decrement = (state = 0) => state - 1
```

But this isn't DRY at all. This is the worst solution.

2) Make an [adapter](/docs/glossary.md#adapter) that controls the initial state:

```javascript
const adapt = inducer => (state = 0) => inducer(state)

const increment = adapt(state => state + 1)
const decrement = adapt(state => state - 1)
```

This is a decent solution in certain situations, especially if we need an adapter anyway to pluck a piece off the state tree:

```javascript
const useCounter = inducer => (
  { counter = 0 } = {}
) => ({ counter: inducer(counter) })

const increment = useCounter(state => state + 1)
const decrement = useCounter(state => state - 1)
```

The caveat (or feature?) of this solution is that it prevents the store from containing state that hasn't been modified yet. In the above example, the store would not contain a `counter` property until we dispatched an `increment` or `decrement` action to it. Probably not what we want. But maybe. Your choice.

3) Hydrate the store with the entire initial state tree upon creation:

```javascript
import { createStore } from 'zedux'

const store = createStore()
  .hydrate({
    counter: 0
  })
```

This solution is good enough for most cases.

4) Dispatch probed inducer adapters:

```javascript
import { createStore } from 'zedux'
import { useCounter } from './counter'

const store = createStore()

// "probe" the useCounter adapter with the identity function:
store.dispatch(useCounter(state => state))
```

This is essentially a fusion of solutions 2 and 3, but with the caveat of solution 2 removed. We can, of course, optimize this for multiple adapters by composing them together. More on that in the [dispatchable reducers guide](/docs/guides/dispatchableReducers.md).

## Conclusion

**pros**

- Easy to get started &ndash; not much code to write.

- Easy to reason about for small applications.

- Zedux ensures that every state update is reproducible, so our time travel debugging desires are satiated satisfactorily.

- Updating the state in a zero configuration setup is much, much more efficient than a reducer setup. To update one tiny corner of state, a reducer hierarchy must traverse the whole tree &ndash; O(n). Inducers, however, pluck the piece they need and update just that &ndash; O(1). This difference probably never matters, but it's there for you to feel good about.

**cons**

- Inducers are [shape bound](/docs/glossary.md#shape-bound), whereas reducers are [shape agnostic](/docs/glossary.md#shape-agnostic).

- Requires either complex or composite inducers to mimic many-to-many actions-to-reducers mappings.

- Relying solely on inducers to update the state tree can become tedious to maintain and reason about in larger applications. This is because there is no single "owner" of each piece of state &ndash; we have to manually hydrate the store's initial state. Also, adapters === boilerplate. Too much of that and you might as well be wiring a reducer hierarchy.

Zero configuration is easy by default. But the easiest solutions are also the least scalable. Pick your patterns and standards carefully. But don't worry too much. Zedux will flex with you as you scale.
