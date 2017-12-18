# ZeduxReactor

The reactor created by the built-in [`react()`](/docs/api/react.md) factory.

A ZeduxReactor is a normal [reactor](/docs/types/Reactor.md) with a couple extra methods for declarative action-reducer-processor mapping.

## The gist

To create a declarative, easy-to-remember api, we must ask, "What will it do?", as opposed to the imperative, "How will it do it?" Asking, "What will the reactor do?" gives us the answer, "React to certain actions with certain reducers and/or certain processors."

What could be simpler than an api that says "React to these actions with these reducers and/or these processors?" This is the ZeduxReactor api.

## Definition

```typescript
interface ZeduxReactor<S = any> extends Reactor<S> {
  to(...actions: (Actor | string)[]): ZeduxReactor<S>
  toEverything(): ZeduxReactor<S>
  withProcessors(...processors: Processor[]): ZeduxReactor<S>
  withReducers(...reducers: Reducer[]): ZeduxReactor<S>
}
```

Note that all methods return the ZeduxReactor for chaining.

## Examples

```javascript
import { react } from 'zedux'

react(/* default initial state here */)
  .to(action1)
  .withReducers(reducer1, reducer2)

  .to(action2, action3)
  .withReducers(reducer3)
  .withProcessors(processor1)
```

## Method API

### `zeduxReactor.to()`

Tells the reactor which action type(s) to react to. Subsequent calls wipe out the previous list. Designed to work with [ZeduxActors](/docs/api/ZeduxActor.md), but any actor or string action type will do.

#### Definition

```typescript
(...actionTypes: Reactable[]) => ZeduxReactor
```

#### Examples

```javascript
react()

  // we can pass a literal action type...
  .to('addTodo')

  // ...an actor (function with a `type` property)...
  .to(addTodo)

  // ...or any combination thereof
  .to('addTodo', removeTodo)
```

### `zeduxReactor.toEverything()`

There is a special `'*'` action type representing all action types. `toEverything()` is a slightly more declarative, magic-string free, less error-prone, version of `to('*')`. But either is fine.

Since it takes no arguments, `toEverything()` prevents you from doing something like the following:

```javascript
react()
  .to(fetchTodos, '*')
  .withProcessor(doFetchTodos)
```

Which doesn't make any sense, but is technically possible. This would result in the `doFetchTodos` processor being called twice for every `fetchTodos` action. Probably not what you want.

#### Definition

```typescript
() => ZeduxReactor
```

#### Examples

Can be used to port existing reducer hierarchies over to the reactor system &ndash; e.g. to take advantage of the processor layer:

```javascript
react()
  .toEverything()
  .withReducers(existingReducerHierarchy)
  .withProcessors(globalProcessor)
```

### `zeduxReactor.withProcessors()`

Specify one or more [processors](/docs/types/Processor.md) that'll be called when this ZeduxReactor receives an action with the given type(s). Does nothing if no action types have been specified with `zeduxReactor.to()`.

#### Definition

```typescript
(...processors: Processor[]) => ZeduxReactor
```

#### Examples

```javascript
react()
  .to(actor)
  .withProcessors(reducer)

  // we can have many-to-many mappings, just like in Redux
  .to(a, b, c)
  .withProcessors(d, e, f)
```


### `zeduxReactor.withReducers()`

Specify one or more [reducers](/docs/types/Reducer.md) (yes, just normal reducers) to which this ZeduxReactor will defer when an action is received with the given type(s). Does nothing if no action types have been specified with `zeduxReactor.to()`.

#### Definition

```typescript
(...reducers: Reducer[]) => ZeduxReactor
```

#### Examples

```javascript
react()
  .to(actor)
  .withReducers(reducer)

  // we can have many-to-many mappings, just like in Redux
  .to(a, b, c)
  .withReducers(d, e, f)
```
