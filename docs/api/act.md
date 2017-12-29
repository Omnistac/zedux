# `act()`

A standard tool for creating [actors](/docs/types/Actor.md). It's mostly just syntactic sugar for creating a string constant action type and corresponding action creator.

`act()` is a factory for creating [ZeduxActors](/docs/api/ZeduxActor.md).

## Definition

```javascript
(actionType: string) => ZeduxActor
```

**actionType** - Required - The `type` of all actions created by this actor. (remember that an actor is an [action creator](/docs/types/ActionCreator.md)). Will be set as the actor's `type` property.

## Usage

```javascript
import { act } from 'zedux'

const addTodo = act('addTodo')
```

## Examples

```javascript
import { act } from 'zedux'

// Create an "increment" actor that enforces multiples of 5
const increment = act('increment')
  .payload(amount => Math.round(amount / 5) * 5)

// Try it out
increment(4) // { type: 'increment', payload: 5 }
increment(7) // { type: 'increment', payload: 5 }
increment(8) // { type: 'increment', payload: 10 }
```

## Static methods

### `act.namespace()`

A utility for namespacing action types. Cool enough for its own [doc page](/docs/api/act.namespace.md).

## Motivation

We've seen what happens when a library leaves the implementation of low-level details (read: boilerplate) up to the user. We get a massive divide between those who think explicitly creating all boilerplate is best, and a couple hundred libraries offering a "better" way.

Zedux provides a high-level api for action and reducer creation out of the box. Since it's actually a pretty good one, the number of competing libraries will be minimal. And the low-level people, while unhindered, will at least not be joined by those whose only reason for writing boilerplate is, "Well, that's how the docs do it."

## Notes

Check out the [ZeduxActor api](/docs/api/ZeduxActor.md) for usage.
