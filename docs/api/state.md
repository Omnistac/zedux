# `state()`

A standard tool for creating [States](/docs/types/State.md).

`state()` is a factory for creating [ZeduxStates](/docs/api/ZeduxState.md).

## Definition

```javascript
(stateName: string) => ZeduxState
```

**stateName** - Required - The name of the State. This will be set as the `type` property of the State (remember that a State is an [actor](/docs/types/Actor.md)). This value will be the `type` property of all actions created by this State.

## Usage

```javascript
import { state } from 'zedux'

const addTodo = state('addTodo')
```

## Examples

```javascript
import { state } from 'zedux'

const increment = state('increment')
```

## Static methods

### `state.namespace()`

A utility for namespacing action types. Functions exactly like [`act.namespace()`](/docs/api/act.namespace.md).

#### Definition

```typescript
(...namespaceNodes: string[]) => (stateName: string) => ZeduxState
```

**namespaceNodes** - One or more nodes defining the namespace. Nodes will be joined with the "/" character.

Returns a modified [`state`](/docs/api/state.md) function that can be used to create States whose types will be automatically prefixed with the given namespace.

## Motivation

We've seen what happens when a library leaves the implementation of low-level details (read: boilerplate) up to the user. We get a massive divide between those who think explicitly creating all boilerplate is best, and a couple hundred libraries offering a "better" way.

Zedux provides a high-level api for action and reducer creation out of the box. Since it's actually a pretty good one, the number of competing libraries will be minimal. And the low-level people, while unhindered, will at least not be joined by those whose only reason for writing boilerplate is, "Well, that's how the docs do it."

## Notes

Check out the [ZeduxState api](/docs/api/ZeduxState.md) for usage.
