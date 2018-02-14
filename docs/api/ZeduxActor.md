# ZeduxActor

The actor created by the built-in [`act()` factory](/docs/api/react.md).

A ZeduxActor is a normal [actor](/docs/types/Actor.md) with a few extra capabilities.

## The gist

Creating actors manually is completely unnecessary boilerplate in almost every case. The ZeduxActor api simplifies actor creation. It creates the actual [action object](/docs/types/Action.md) for you and allows you to specify how to create the payload. The identity function (`arg => arg`) is the default payload creator and is sufficient for most situations.

## Definition

```typescript
interface ZeduxActor<T extends string> extends Actor<T> {
  payload(payloadCreator: Function): ZeduxActor<T>
}
```

## Examples

The following two examples are almost exactly equivalent:

```javascript
const increment = () => ({ type: increment.type })

increment.type = 'increment'

increment() // { type: 'increment' }
increment(2) // { type: 'increment' }
```

```javascript
import { act } from 'zedux'

const increment = act('increment')

increment() // { type: 'increment' }
increment(2) // { type: 'increment', payload: 2 }
```

So much more work from so much less code!

That second example used the default payload creator &ndash; the identity function. Let's specify a custom payload creator:

```javascript
import { act } from 'zedux'

const addTodo = act('addTodo')
  .payload(text => ({ text, isComplete: false }))

addTodo('win') /* ->
  { type: 'addTodo', payload: { text: 'win', isComplete: false } }
*/
```

## Properties

### `zeduxActor.type`

A string. This will be the `type` property of all actions created by this actor. See the [Actor type definition](/docs/types/Actor.md).

## Method API

### `zeduxActor.payload()`

Overwrites the default payload creator function (the identity function &ndash; `arg => arg`). Returns the ZeduxActor for chaining.

#### Definition

```typescript
(payloadCreator: Function) => ZeduxActor
```

#### Examples

```javascript
import { act } from 'zedux'

const addTodo = act('addTodo')
  .payload(text => ({ text, isComplete: false }))

addTodo('pown') /* ->
  {
    type: 'addTodo',
    payload: { text: 'pown', isComplete: false }
  }
*/
```
