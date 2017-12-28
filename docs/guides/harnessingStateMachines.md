# Harnessing State Machines

Zedux ships with basic support for one of the simplest yet most powerful mechanisms for managing state: State machines.

A state machine is just a graph. The possible states are the nodes of the graph. The possible state transitions are directed edges connecting the nodes.

For example, a machine with 4 states:

- a
- b
- c
- d

(where "a" is the start state) and the following edges:

- a -> b
- a -> c
- c -> d
- d -> b

can be represented visually like so:

```
a  ->  b

|      ^
v      |

c  ->  d
```

and in Zedux like so:

```javascript
import { transition } from 'zedux'

const machine = transition('a') // 'a' - the start state
  .to('b', 'c') // create the a -> b and a -> c edges

  .from('c')
  .to('d') // create the c -> d edge
  .to('b') // create the d -> b edge
```

State machines are particularly useful in two scenarios:

## Scenario 1 - Sequential state

State machines are useful when state has a sequence or flow to it. Think a three-part form:

- The user starts at step one.
- From step one, the user may proceed to step two.
- From step two, the user may:
  - return to step one.
  - proceed to step three.
- From step three, the user may:
  - return to step two.
  - submit the form.

This flow diagram would be perfectly represented as a state machine with 4 states:

- stepOne
- stepTwo
- stepThree
- submitted

And the following edges:

- stepOne -> stepTwo
- stepTwo -> stepOne
- stepTwo -> stepThree
- stepThree -> stepTwo
- stepThree -> submitted

We can represent this machine easily with a [Zedux machine](/docs/api/ZeduxMachine.md):

```javascript
import { state, transition } from 'zedux'

const stepOne = state('stepOne')
const stepTwo = state('stepTwo')
const stepThree = state('stepThree')
const submitted = state('submitted')

const machine = transition(stepOne)
  .to(stepTwo)
  .to(stepOne, stepThree)

  .from(stepThree)
  .to(stepTwo, submitted)
```

## Scenario 2 - Fixed states

While sequential state is where state machines really show their prowess, state machines are actually useful for any piece of state whose possible values are all known ("fixed"). Think a group of radio buttons that control a filter over a list of todos:

- By default, all todos are visible.
- The user may select a filter to see only complete todos.
- The user may select a filter to see only incomplete todos.
- The user may remove the filter to see all todos.

This filter can be represented as a state machine with 3 states:

- showAll
- showComplete
- showIncomplete

And the following edges:

- showAll -> showComplete
- showAll -> showIncomplete
- showComplete -> showAll
- showComplete -> showIncomplete
- showIncomplete -> showAll
- showIncomplete -> showComplete

We can introduce the concept of undirected edges to simplify this:

- showAll <-> showComplete <-> showIncomplete <-> showAll

[Zedux machines](/docs/api/ZeduxMachine.md) handle this scenario perfectly:

```javascript
import { state, transition } from 'zedux'

const showAll = state('showAll')
const showComplete = state('showComplete')
const showIncomplete = state('showIncomplete')

const machine = transition(showAll)
  .undirected(showAll, showComplete, showIncomplete)
```

## Processing

Here we're talking about the store's [processor layer](/docs/guides/theProcessorLayer.md). You may want to read up on that if you haven't already.

This is a fascinating aspect of state machines. States define how they should be processed. Each state can have an `enter` and/or `leave` hook. These hooks are [processors](/docs/types/Processor.md). They are called when the machine enters or leaves the given state, respectively. Specifically, they are called when the store's processor layer is hit after the store's reducer layer causes the machine to transition from one state to another.

Consider the following example:

```javascript
import { createStore, state, transition } from 'zedux'

// Create our states
const idle = state('idle')
const fetchTodos = state('fetchTodos')
  .onEnter(async (dispatch, action) => {
    try {
      const result = await fetch('/api/todos')

      dispatch(fetchTodos.success(result))
    } catch (err) {
      dispatch(fetchTodos.failure(err))
    }
  })

fetchTodos.success = state('fetchTodos', 'success')
fetchTodos.failure = state('fetchTodos', 'failure')

// Define the transitions between our states
const fetchTodosMachine = transition(idle)
  .to(fetchTodos)
  .to(fetchTodos.success, fetchTodos.failure)

// Create a store for this example
const store = createStore({
  fetchTodosStatus: fetchTodosMachine
})

// Dispatch some actions
store.dispatch(fetchTodos())

// The machine is already in the "fetchTodos" state.
// This will have no effect:
store.dispatch(fetchTodos())
```

Zedux will ensure that the attached `enter` hook gets called when the `fetchTodosMachine` enters the `fetchTodos` state. This hook will asynchronously fetch some data and dispatch actions that further transition the state of the machine.

This example also illustrates another useful feature of state machines: This machine can only send one request. Once it enters the `fetchTodos` state, nothing can ever cause it to enter that state again. In React, for example, this means we could mount multiple components at once that all attempt to `fetchTodos`. Only the first one will actually trigger a request, but all components can access the fetched data.

## Aliasing transitions

In Zedux we don't necessarily bother naming the edges of the state machine graph. But semantically this may be desirable. We can alias target states as transition names to mimic this effect:

```javascript
import { state } from 'zedux'

// "isFetchingTodos" is clearly the name of a state, but it's
// rather awkward calling it as a function; such a function would
// normally return a boolean, but this returns an action object:
const isFetchingTodos = state('isFetchingTodos')

// To overcome this, we can alias the state name as a
// "transition" - the action that's actually taking place:
export const fetchTodos = isFetchingTodos
```

Now this is more semantically correct; another file doesn't need to know the name of the target state, it just needs to know the name of the action it takes to get there:

```javascript
import { fetchTodos } from './store/todos'

store.dispatch(fetchTodos())
```
