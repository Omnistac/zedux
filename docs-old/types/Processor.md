# Processor

Processors are the king of the beastly side effects model of Zedux. Their job is to "process" actions. Processors perform side effects like ajax requests and setting timeouts.

A processor is basically just a thunk. But [`ZeduxReactor`](/docs/api/ZeduxReactor.md)s can handle promises, generators, and observables as sub-processors. This makes for some mean async handling.

## Definition

```typescript
interface Processor<S = any> {
  (
    dispatch: (dispatchable: Dispatchable): S,
    action: Action,
    state: S
  ): void
}
```

**dispatch** - The store's dispatch method. Insert Action Here.

**action** - The current action being shuttled through the store's processor layer.

**state** - The current state of the state slice controlled by this processor's reactor.

## Notes

Read up on processors in the [processor layer guide](/docs/guides/theProcessorLayer.md).
