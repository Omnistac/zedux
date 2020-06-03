# Meta Chains

Meta chains are an exciting, unique feature of Zedux. Meta chains replace the `meta` property on [Flux Standard Actions](https://github.com/acdlite/flux-standard-action). Though you can, of course, still add a `meta` property to your actions.

## The gist

How about an example to start? Let's take a boring [action](/docs/types/Action.md):

```javascript
const addTodoAction = {
  type: 'addTodo',
  payload: 'make a meta chain'
}
```

Meta chains are a standard format for meta data. Let's metafy this action:

```javascript
const metafiedAddTodoAction = {
  metaType: 'instructionToEffectsSubscribers',
  metaData: [ 'be', 'the', 'best' ],
  payload: {
    type: 'addTodo',
    payload: 'make a bigger meta chain'
  }
}
```

A meta chain is a singly linked list composed of [meta chain nodes](/docs/types/MetaChainNode.md). The last node in the chain must be a normal [action object](/docs/types/Action.md). All other nodes in the chain (if any) must be [meta nodes](/docs/types/MetaNode.md).

A meta node is very similar to a normal action object. It's an object with required `metaType` and `action` properties and an optional `metaData` property:

```typescript
interface MetaNode {
  metaType: string,
  metaData?: any,
  payload: MetaChainNode
}
```

A meta node's `payload` property holds the next link in the chain.

## Why meta chains?

There are 2 main purposes for meta chains:

1. Store [inspectors](/docs/types/Inspector.md) will be passed the entire chain. Since inspectors are used for logging and recording actions, meta data can contain helpful debugging notes, for example.

2. Meta chains are a standard way to format meta data so that Zedux can understand it.

Zedux will ignore any meta types it doesn't understand. But there are some [built-in types](/docs/api/metaTypes) that Zedux does understand. Sticking one of these types on an action's meta chain basically tags it for Zedux. There are some cool things Zedux can do with these "tagged" actions, such as:

- Time travel with composed stores. See the [store composition guide](/docs/guides/storeComposition.md).

- Optimizations/dispatch flow control, such as making an action skip the store's reducer and/or processor layers entirely.

## Notes

In most cases, you really shouldn't add the built-in meta types to actions yourself. Zedux does some action wrapping and unwrapping internally. Just let it do its thing.
