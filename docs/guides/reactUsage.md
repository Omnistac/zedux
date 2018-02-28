# React Usage

Zedux is framework (and library...) agnostic. But it is designed especially to be used with React and React-like libraries.

In this guide, we'll use [React Zedux](https://github.com/bowheart/react-zedux), the official React bindings for Zedux. React Zedux does all the hard stuff for us.

## Overview

How do Zedux stores and React components achieve stateful view awesomeness? This seems simple enough:

```javascript
import { createStore } from 'zedux'

const coolStore = createStore()
  .hydrate('such coolness')

function CoolComponent() {
  return 'cool stuff: ' + coolStore.getState()
}
```

Yikes! We've tightly coupled our component to a single store instance. This may be fine for a prototype or two, but it won't do well in the real world. Let's do better:

```javascript
import coolStore from './coolStore'

function CoolComponent({ coolStore }) {
  return 'cool stuff: ' + coolStore.getState()
}

function CoolParent() {
  <CoolComponent coolStore={coolStore} />
}
```

Much better. `CoolComponent` is no longer tightly coupled to a single store &ndash; it receives one dynamically via props. Now that the component is store agnostic, we can feed it a component-bound, or otherwise-dynamically-created store.

### But wait! Now `CoolParent` is tightly coupled to a store!

Well somebody's gotta be. The trick lies in isolating store-bound compnents and lifting them up to the lowest common parent of dependents.

## Context

Our current store-passing approach has limitations &ndash; namely the "prop drilling" problem: Passing the store as a prop can quickly become tedious with deeply nested components. To overcome this, we need to create a Context:

```javascript
import React from 'react'
import { createContext } from 'react-zedux'
import coolStore from './coolStore'

const CoolContext = createContext(coolStore)

function CoolParent() {
  return (
    <CoolContext.Provider>
      <CoolComponent />
    </CoolContext.Provider>
  )
}
```

This is very similar to the context api of React 16.3. In fact, that's what it's using, under the hood.

The `<Context.Provider />` is magic. That's all. Just remember that it allows its descendants to consume the store.

## Consuming the store

The Context object contains a Consumer component that we can use to consume the provided store.

```javascript
import CoolContext from './contexts/CoolContext'

function CoolComponent() {
  return (
    <CoolContext.Consumer>
      {coolStore => coolStore.getState()}
    </CoolContext.Consumer>
  )
}
```

We pass a render prop as the `<Consumer>`'s only child. This render prop is passed a wrapped form of the store. And it's called every time the store's state updates.

The end.

## Notes

Unlike React 16.3's built-in contexts, a ReactZedux `<Consumer>` will throw an error if used without its matching `<Provider>`. If you really want to provide and consume the store, either explicitly include the `<Provider>` or use `<Context.Injector>` instead. The `<Injector>` is just a shorthand for providing and immediately consuming the store.

The wrapped store passed to the Consumer's render prop contains a single additional property: `state`. This property will always be the current state of the store. In our last example, we could have done:

```js
<CoolContext.Consumer>
  {coolStore => coolStore.state}
</CoolContext.Consumer>
```

or simply:

```js
<CoolContext.Consumer>
  {({ state }) => state}
</CoolContext.Consumer>
```

and achieved the same result.

React Zedux also comes with Higher-Order Component equivalents of the Context's normal components. Check those out in the React Zedux [Context documentation](https://bowheart.github.io/react-zedux/types/Context).

In fact, overall we took a fairly low-level approach here. Don't worry. React Zedux has a couple layers of sugar on top of this to ease store api creation, provision, and consumption. [Check it out](https://github.com/bowheart/react-zedux)!
