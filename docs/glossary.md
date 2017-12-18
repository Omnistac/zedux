# Glossary

## Adapter

A type of abstraction for [shape bound](#shape-bound) entities. All entities in a Zedux ecosystem are striving to be shape agnostic. This is impossible in many cases. An adapter basically turns a shape dependency into an adapter dependency.

Let's take an example.

We have a selector, `selectEquippedShieldStats` whose job is to return the equipment stats of the shield our character currently has equipped. Like all selectors, this selector is shape bound. Since our state is normalized, the selector needs to know two things:

1. Where the list of current equipment is stored.
2. Where the list of shield entities are stored.

Let's take the naive approach first:

```javascript
const selectEquippedShieldStats = state => {
  const equippedShieldId = state.currentEquipment.shield

  return  state.entities.shields[equippedShieldId]
}
```

Here we went ahead and caved into the shape bound nature of our selector, plucking stuff willy-nilly off the state tree. Let's be better:

```javascript
import { select } from 'zedux'

const selectShields = state => state.entities.shields

const selectEquippedShield = state => state.currentEquipment.shield

const selectEquippedShieldStats = select(
  selectShields,
  selectEquippedShield,
  (shields, equippedShieldId) => shields[equippedShieldId]
)
```

Here we created some adapters, `selectEquippedShield` and `selectShields` whose sole job is to know the shape of the state and pluck a piece off of it. Now the `selectEquippedShieldStats` selector has almost achieved shape agnosticism. Rather than depending on the state tree, he depends on two adapters.

The `selectEquippedShieldStats` selector now has something in common with shape agnostic entities. Apart from being beautifully declarative, the `selectEquippedShieldStats` selector can now easily be plugged in to any store, given the right adapters.

There are many types of adapters. Another type of selector adapter is one that finds the state of a child store in a parent store's state tree and feeds it to selectors in the child store:

```javascript
import { selectWeapons } from './equipmentStore/selectors'

const equipmentStoreAdapter = selector => state =>
  selector(state.entities.equipment)

const selectEquippedWeapon = state => state.currentEquipment.weapon

const selectEquippedWeaponStats = select(
  equipmentStoreAdapter(selectWeapons),
  selectEquippedWeapon,
  (weapons, equppedWeaponId) => weapons[equippedWeaponId]
)
```

## Shape Agnostic

A shape agnostic entity does not know the shape of the state. It either doesn't deal with the state, or is handed the piece of state relevant to it and that's all it needs to know about.

Shape agnostic entities can be re-used in different parts of the store, or in different stores completely.

Shape agnostic entities are preferred to shape bound entities whenever possible.

Examples: Reactors, reducers, processors, and actors.

## Shape Bound

Antonym of shape agnostic. A shape bound entity knows the shape of the state tree. Shape bound entities must (by default - there are plenty of ways to abstract it out) know where in the state tree the piece of state lives that they need.

Examples: Selectors, inspectors, inducers, React components, and the hierarchy descriptor.

## Shape Relation

The relation an entity has with the shape of the state &ndash; [agnostic](#shape-agnostic) or [bound](#shape-bound).

Many problems arise from mixing entities with different shape relations. Read up on them [here](/docs/shapeRelationProblems.md).

## Store Agnostic

A store agnostic entity does not know which store is using it. Most entities are store agnostic by default, the only exception being the store's own methods.

## Store Bound

A store bound entity can only interact with a single store.

Examples: Store methods are store bound. Selectors, actors/action creators, and inducers can all be bound to a single store.

```javascript
import { createStore } from 'zedux'

const store = createStore()

const addTodo = text => ({ text, isComplete: false })

// This bound addTodo action creator can only dispatch
// actions to this one, single store.
const boundAddTodo = (...args) => store.dispatch(addTodo(...args))
```
