# `transition()`

A standard tool for creating [reactors](/docs/types/Reactor.md) that behave like state machines. State machines make certain tasks extremely easy to reason about.

`transition()` is a factory for creating [ZeduxMachines](/docs/api/ZeduxMachine.md).

## Definition

```typescript
(initialState: (State | string)) => ZeduxMachine
```

**initialState** - Required - The initial state. Can be a valid [State](/docs/types/State.md) or a string state name.

## Usage

```javascript
import { transition } from 'zedux'

const machine = transition(/* initial state here */)
```

## Notes

Check out the [harnessing state machines guide](/docs/guides/harnessingStateMachines.md) for examples of the power that state machines bring to the table.

Check out the [ZeduxMachine api](/docs/api/ZeduxMachine.md) to dig into the usage specifics.
