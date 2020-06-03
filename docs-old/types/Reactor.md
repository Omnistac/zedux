# Reactor

A reactor is just a glorified [reducer](/docs/types/Reducer.md) &ndash; "glorified" meaning it has one **optional** additional property, `process`, whose value is a [processor](/docs/types/Processor.md).

Reactors are typically composed together to create reactor hierarchies. These are analogous to reducer hierarchies in Redux. A reactor hierarchy is used to create a state tree, delegating management of the pieces of that tree to individual reactors. Read more about creating a reactor hierarchy in the [reducer layer guide](/docs/guides/theReducerLayer.md).

## Definition

```typescript
interface Reactor<S = any> {
  (state: S, action: Action): S
  process?: Processor
}
```

In other words, a Reactor *is a* [reducer](/docs/types/Reducer.md).

**process** - Optional - A valid [processor](/docs/types/Processor.md).

## Notes

Processors are the king of the beastly side effects model of Zedux. Read more about them in the [processors guide](/docs/guides/theProcessorLayer.md).

While there's nothing wrong with putting reactors together yourself, Zedux ships with a high-level api for creating them. See [react](/docs/api/react.md) and the [ZeduxReactor api](/docs/api/ZeduxReactor.md).

While there's nothing wrong with putting reactor hierarchies together yourself, Zedux ships with a high-level api for creating them. See [`store.use()`](/docs/api/Store.md#storeuse).
