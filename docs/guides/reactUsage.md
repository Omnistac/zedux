# React Usage

Zedux is framework (and library...) agnostic. But it is designed especially to be used with React and React-like libraries.

In this guide, we'll use [React Zedux](https://github.com/bowheart/react-zedux), the official React bindings for Zedux. React Zedux does all the hard stuff for us, plus it re-exports all the Zedux internals so our normal component files have one less dependency.

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
function CoolComponent({ coolStore }) {
  return 'cool stuff: ' + coolStore.getState()
}

function CoolParent() {
  <CoolComponent coolStore={coolStore} />
}
```

Much better. `CoolComponent` is no longer tightly coupled to a single store &ndash; it receives one dynamically via props. Now that the component is store agnostic, we can feed it a component-bound, or otherwise-dynamically-created store.

### But wait! Now `CoolParent` is tightly coupled to a store!

Ah, yes. Well, you see, the truth of the matter is that we'll never be free of tightly-coupled components. The trick lies in isolating them and lifting them up to the lowest common parent of dependent components.

## Providers

The component that passes a store to its children is called a Provider. But our current approach has limitations &ndash; passing the store as a prop can quickly become tedious with deeply nested components. To overcome this, we'll make use of a special component from React Zedux:

```javascript
import React from 'react'
import { Provider } from 'react-zedux'

function CoolParent() {
  return (
    <Provider id={CoolParent} store={coolStore}>
      <CoolComponent />
    </Provider>
  )
}
```

The `<Provider />` is just magic. That's all. All we need to know is that it takes two props: `id` and `store`. The store is a store. Yep. The id is an id, but it deserves a little more explanation:

## The id

A Zedux app has many stores composed together in a store hierarchy. We tie this store hierarchy into our component hierarchy using Providers. This means that a child component can have multiple stores provided to it from multiple ancestors! How does the child know which store to use?

Each store needs a unique identifier. While this identifier can be anything, it'll typically be the component that provides the store (`CoolParent` in our example). Yes, the parent component itself is the id.

## Isolating Providers

Throwing `<Provider />` components all over the place gets messy quickly. We need to separate our data from our UI. To do this, we'll use custom Providers.

A custom Provider is a component whose sole role is to create/find, decorate, and provide a store:

```javascript
import React, { Component } from 'react'
import { Provider, createStore } from 'react-zedux'

class CoolProvider extends Component {
  store = createStore()
    .hydrate('such coolness')

  render() {
    return (
      <Provider id={CoolProvider} store={this.store}>
        {this.props.children}
      </Provider>
    )
  }
}
```

This is a normal custom Provider layout. The custom Provider just takes a store and wraps his children in a `<Provider />`. In this example, we created a component-bound store that'll live and die with the component. This doesn't have to be the case &ndash; we could just as well use a global store.

## Consuming the store

React Zedux gives us an HOC that we can use to grab a store provided by an ancestor:

```javascript
import { withStores } from 'react-zedux'

export default withStores({
  coolStore: CoolProvider
})(CoolComponent)

function CoolComponent({ coolStore }) {
  return coolStore.getState()
}
```

And that's all there is to it. We pass `withStores()` a `propName`-to-`storeId` map. Zedux finds the appropriate stores for us (using that all-important `id`) and passes them to `CoolComponent` as the given props.

The end.

## Notes

We took a fairly low-level approach here. Don't worry. React Zedux has a couple layers of sugar on top of this to ease store interface creation, provision, and consumption. [Check it out](https://github.com/bowheart/react-zedux)!
