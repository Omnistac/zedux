# `act.namespace()`

A standard tool for namespacing action types. Ideally this should always be used.

## Definition

```typescript
(...namespaceNodes: string[]) => (actionType: string) => ZeduxActor
```

**namespaceNodes** - One or more nodes defining the namespace. Nodes will be joined with the "/" character.

Returns a modified [`act`](/docs/api/act.md) function that can be used to create actors whose types will be automatically prefixed with the given namespace.

## Usage

```javascript
import { act } from 'zedux'

const namespacedAct = act.namespace('myNamespace')
```

## Examples

```javascript
import { act } from 'zedux'

// overwrite the local "act" variable so everything in this file
// uses the namespaced version:
act = act.namespace('todos', 'urgent')

export const addTodo = act('add')
export const removeTodo = act('remove')

addTodo() // { type: 'todos/urgent/add' }
removeTodo() // { type: 'todos/urgent/removeTodo' }
```

## The case for namespaced actions

Here are some advantages of namespacing action types:

- Easy to avoid action type collisions.

- Easy to debug. Namespacing action types relative to their location in the file tree makes it easy to find action creators and reducers that handle that action type.

- So much easier to read, because:

  - The actual "action" is obvious.

  - Sub-actions are obvious.

  - Nodes are well-defined.

### Easier to read

Compare the unnamespaced:

```javascript
'FETCH_ALL_TODOS'
'FETCH_ALL_TODOS_REQUESTED'
```

to the namespaced:

```javascript
'todos/fetchAll'
'todos/fetchAll/requested'
```

As opposed to the unnamespaced actions, the namespaced action types make it obvious that:

- "fetchAll" and "requested" are the two actions.

- "requested" is a sub-action of "fetchAll".

- "fetchAll" is its own node (the double-word node throws off most naming conventions).

- "todos" is the entity these actions are acting on.

Good luck visually or programatically parsing all that from the straight-English unnamespaced action types.

### Avoids collisions

There is no ambiguity between these two `fetchWeapon` action creators:

```javascript
import { fetchWeapon } from './entities/weapons'
```

```javascript
import { fetchWeapon } from './character/currentEquipment'
```

The location of these modules in the file path effectively "namespaces" these two `fetchWeapon` functions. But the action types declared in these files have no such benefit:

```javascript
// ./entities/weapons.js
const FETCH_WEAPON = 'FETCH_WEAPON'
```

```javascript
// ./charactor/currentEquipment
const FETCH_WEAPON = 'FETCH_WEAPON'
```

The conflict here is obvious. If an action with either of these action types is dispatched to the store, the reducers for both will respond to it. This may be an uncommon scenario, but it'll be a big time-waster when it happens to you.

All action types live in a global pool. Global stuff is always hard to keep track of. One solution is to move all action types into a single "actions.js" file, which makes it easy to see any duplicates. But this isn't necessary.

Ideally, action types should be colocated with the reducers they're most often meant to trigger. Properly namespaced action types will never conflict.
