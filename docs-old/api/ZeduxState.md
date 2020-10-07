# ZeduxState

The State created by the built-in [`state()` factory](/docs/api/state.md).

A ZeduxState is a normal [State](/docs/types/State.md) with a few extra methods for easily declaring `enter` and `leave` hooks.

A ZeduxState is *also* a valid [ZeduxActor](/docs/api/ZeduxActor.md), complete with `payload()` method for overriding the default identity function payload creator.

## Definition

```typescript
interface ZeduxState<T extends string> extends State<T>, ZeduxActor<T> {
  onEnter(processor: Processor): ZeduxState<T>
  onLeave(processor: Processor): ZeduxState<T>
}
```

**onEnter** - A function that accepts a valid [processor](/docs/types/Processor.md) and sets it as this State's `enter` property.

**onLeave** - A function that accepts a valid [processor](/docs/types/Processor.md) and sets it as this State's `leave` property.

## Examples

The classic traffic light example:

```javascript
import { createStore, state, transition } from 'zedux'

const green = state('green')
  .onEnter(dispatch => {
    setTimeout(
      () => dispatch(yellow()),
      2000
    )
  })

const yellow = state('yellow')
  .onEnter(dispatch => {
    setTimeout(
      () => dispatch(red()),
      500
    )
  })

const red = state('red')
  .onEnter(dispatch => {
    setTimeout(
      () => dispatch(green()),
      2000
    )
  })

const trafficLight = transition(green)
  .to(yellow)
  .to(red)
  .to(green)

const store = createStore()
  .use(trafficLight)

store.subscribe((newState, oldState) => {
  console.log(`light went from ${oldState} to ${newState}`)
})
```

## Method API

### `zeduxState.onEnter()`

Sets the `enter` property of the ZeduxState.

#### Definition

```typescript
(processor: Processor) => ZeduxState
```

**processor** - A valid [processor](/docs/types/Processor.md) that will be called when the machine enters this state.

Returns the ZeduxState for chaining.

#### Examples

The following two examples are essentially equivalent:

```javascript
const isFetching = () => ({ type: 'isFetching' })
isFetching.type = 'isFetching'
isFetching.enter = () => console.log(`entered ${isFetching.type} state`)
```

```javascript
import { state } from 'zedux'

const isFetching = state('isFetching')
  .onEnter(() => console.log(`entered ${isFetching.type} state`))
```

### `zeduxState.onLeave()`

Sets the `leave` property of the ZeduxState.

#### Definition

```typescript
(processor: Processor) => ZeduxState
```

**processor** - A valid [processor](/docs/types/Processor.md) that will be called when the machine leaves this state.

Returns the ZeduxState for chaining.

#### Examples

The following two examples are essentially equivalent:

```javascript
const isFetching = () => ({ type: 'isFetching' })
isFetching.type = 'isFetching'
isFetching.leave = () => console.log(`left ${isFetching.type} state`)
```

```javascript
import { state } from 'zedux'

const isFetching = state('isFetching')
  .onLeave(() => console.log(`left ${isFetching.type} state`))
```

## Notes

ZeduxStates are a conglomeration of many different concepts of Zedux. As such, it can be difficult to remember everything they do. Just remember these 4 pieces that make up a ZeduxState:

- A ZeduxState is an [actor](/docs/types/Actor.md). It has a `type` property denoting its action type. It also **is** an action creator function &ndash; when called, it returns an action whose `type` is the State's `type` property.

- A ZeduxState is a [ZeduxActor](/docs/api/ZeduxActor.md). It thus has a `payload()` method for overriding the default payload creator function. This `payload()` method returns the ZeduxActor for chaining.

- A ZeduxState is a [State](/docs/types/State.md). It can have optional `enter` and `leave` properties that should be called when the machine enters and leaves this State, respectively.

- A ZeduxState has two additional, unique methods: `onEnter()` and `onLeave()`. These are just convenience methods for setting the `enter` and `leave` properties, respectively. They both return the ZeduxState for chaining.

> Note that both `State` and `ZeduxActor` extend the `Actor` interface. `ZeduxState` extends both `State` and `ZeduxActor`, creating a cute little diamond, if we were to diagram this inheritance hierarchy.

![ZeduxState inheritance tree](/docs/img/ZeduxState-inheritance-tree.png)
