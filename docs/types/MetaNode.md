# MetaNode

A meta node wraps an action in meta data. It is a node in a meta chain. There are a few [built-in meta types](/docs/api/metaTypes.md), but you can use custom types as well.

## Definition

```ts
interface MetaNode {
  metaType: string,
  metaData?: any,
  payload: MetaChainNode
}
```

**metaType** - Some string that identifies this meta node. Analogous to the `type` property of [actions](/docs/types/Action.md). Avoid using names starting with `'@@zedux/'` as these are reserved for internal Zedux meta types.

**metaData** - Optional - Can be literally anything.

**payload** - The next node in the chain. The last meta node in the chain must specify the wrapped action as its `payload` property.

## Notes

Zedux uses meta nodes internally to handle the intricacies of store composition. But you can use them too. A good use case is to add extra debugging information to dispatched actions:

```js
store.dispatch({
  metaType: 'debugInfo',
  metaData: 'dispatched from the login form',
  payload: someActor()
})
```
