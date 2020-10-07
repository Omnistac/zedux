# ZeduxMachine

The reactor created by the built-in [`transition()`](/docs/api/transition.md) factory.

A ZeduxMachine is a normal [reactor](/docs/types/Reactor.md) with a couple extra methods for defining how the "machine" transitions from one state to the next.

## The gist

To create a declarative, easy-to-remember api, we must ask, "What will it do?", as opposed to the imperative, "How will it do it?" Asking, "What will the state machine do?" gives us the answer, "Transition from one state to the next."

What could be simpler than an api that says, "Transition from these states to these states"? This is the ZeduxMachine api.

Zedux machines are designed for use with [ZeduxStates](/docs/api/ZeduxState.md), but any valid [State](/docs/types/State.md) or raw action type string will do. When given States, Zedux machines ensure that each State's `leave` hook is called when the machine leaves that state and that its `enter` hook is called when the machine enters that state.

## Definition

```typescript
interface ZeduxMachine extends Reactor<string> {
  from(...states: (State | string)[]): ZeduxMachine
  to(...states: (State | string)[]): ZeduxMachine
  undirected(...states: (State | string)[]): ZeduxMachine
}
```

Note that a ZeduxMachine IS A [reactor](/docs/types/Reactor.md) whose state shape is always a string.

Note that all methods return the ZeduxMachine for chaining.

## Examples

```javascript
import { transition } from 'zedux'

const machine = transition(stateA)
  .from(stateA)
  .to(stateB)
  .from(stateB)
  .to(stateC)
```

Cool, but that is so unnecessarily verbose. Here's a shorthand for the above:

```javascript
import { transition } from 'zedux'

const machine = transition(stateA)
  .to(stateB)
  .to(stateC)
```

## Method API

### `zeduxMachine.from()`

Sets the current list of "from" states &ndash; the states "from" which we will draw directed edges "to" other states. Subsequent calls wipe out the previous list. Does nothing by itself; must be used in conjunction with `zeduxMachine.to()`.

This method is normally not necessary, as `zeduxMachine.to()` also sets the current list of "from" states when it's finished drawing edges between the given states. Use this to define more complex transitions &ndash; or to be super verbose, if that's your thing.

#### Definition

```typescript
(...states: (State | string)[]) => ZeduxMachine
```

**states** - Any number of valid [States](/docs/types/State.md) and/or string state names.

#### Examples

```javascript
import { transition } from 'zedux'

const machine = transition('a')
  .from('a', 'b', 'c')
  .to('d')

machine('a', 'b') // returns 'a' - not a valid transition
machine('a', 'd') // returns 'd' - a valid transition
```

### `zeduxMachine.to()`

Draws a directed "edge" from each of the current "from" states to each of the passed states. Designed to work with [ZeduxStates](/docs/api/ZeduxState.md), but any [State](/docs/types/State.md) or string action type will do.

After drawing the edges, sets the current list of "from" states to the passed states.

#### Definition

```typescript
(...states: (State | string)[]) => ZeduxMachine
```

**states** - Any number of valid [States](/docs/types/State.md) and/or string state names.

#### Examples

```javascript
import { transition } from 'zedux'

const machine = transition('a')
  .from('a', 'b')
  .to('c', 'd', 'e')
```

Sets the current list of "from" states after it's done drawing edges:

```javascript
import { transition } from 'zedux'

const machine = transition('form-step-one')
  .to('form-step-two')
  .to('form-step-one', 'form-step-three')

  .from('form-step-three')
  .to('form-step-two', 'form-submitted')

// the above machine is equivalent to the more verbose:
const verboseMachine = transition('form-step-one')
  .from('form-step-one')
  .to('form-step-two')

  .from('form-step-two')
  .to('form-step-one', 'form-step-three')

  .from('form-step-three')
  .to('form-step-two', 'form-submitted')
```

### `zeduxMachine.undirected()`

Draws undirected edges between each of the given states. Also sets the current list of "from" states to the passed states. Thus:

```javascript
import { transition } from 'zedux'

const machine = transition('a')
  .undirected('a', 'b', 'c')
```

is essentially a shorthand for:

```javascript
import { transition } from 'zedux'

const machine = transition('a')
  .from('a', 'b', 'c')
  .to('a', 'b', 'c')
```

#### Definition

```typescript
(...states: (State | string)[]) => ZeduxMachine
```

**states** - Any number of valid [States](/docs/types/State.md) and/or string state names.

#### Examples

```javascript
import { transition } from 'zedux'

const machine = transition('a')
  .undirected('a', 'b', 'c')
```

This method makes Zedux machines useful for any situation where there are a fixed number of states. For example, the famed visibility filter in the Redux todos example is represented perfectly with a set of undirected state edges:

```javascript
import { createStore, state, transition } from 'zedux'

const showAll = state('showAll')
const showComplete = state('showComplete')
const showIncomplete = state('showIncomplete')

const visibilityFilter = transition(showAll)
  .undirected(showAll, showComplete, showIncomplete)

const store = createStore()
  .use({
    visibilityFilter
  })

store.getState() // { visibilityFilter: 'showAll' }

store.dispatch(
  showComplete()
) // { visibilityFilter: 'showComplete' }

store.dispatch(
  showIncomplete()
) // { visibilityFilter: 'showIncomplete' }
```

## Notes

It's helpful to think of Zedux machines as normal graphs, rather than as a DFA, or any type of automaton. Zedux machines don't (currently!) have any notion of an "accept" state, for example. This is because there is no set amount of "input" (dispatched actions) for Zedux stores.

The piece of state controlled by a Zedux machine is always a string! That string is the name of the current state. Any other data associated with the machines will need to be stored somewhere else in the state tree.
