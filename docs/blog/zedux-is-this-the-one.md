---
title: 'Zedux: Is this the one?'
image: /img/zedux-and-react.png
tags: [introductory]
---

Zedux is a molecular state engine for React. After years spent as proprietary software hidden in a private GitHub repo, it's officially open-sourced and version 1.0.0 has been released!

<!-- truncate -->

Here's a simple hello world example to start off:

```tsx
import { atom, useAtomState } from '@zedux/react'

const greetingAtom = atom('greeting', 'Hello, World!')

function Greeting() {
  const [greeting, setGreeting] = useAtomState(greetingAtom)

  return (
    <input
      onChange={event => setGreeting(event.target.value)}
      value={greeting}
    />
  )
}
```

Zedux features a composable store model wrapped in a DI-driven atomic architecture. This article will break down why it exists and what problems it solves. If you don't care about all that and just want to learn Zedux, head to the [quick start](https://omnistac.github.io/zedux/docs/walkthrough/quick-start) or the [examples](https://omnistac.github.io/zedux/examples).

## How Dare You Make Another One Of These Things??

Chill. Zedux has a long history. Read some of it [here](https://omnistac.github.io/zedux/blog/zedux-open-sourced). It is only recently open-sourced in its current form.

We made Zedux primarily to fix performance and maintenance problems in a socket-driven app that previously used - wait for iiiit - [Redux](https://redux.js.org/).

I want to be clear: I love Redux. I still get chills thinking about time travel and the peace of mind its unidirectional data flow and raw immutability give you. The nature of this article demands some comparison, so _reluctantly_, here's what we encountered and why Zedux is different - not just from Redux, but many other tools we tested:

## Stores

As the name indicates, Zedux's store model is inspired by Redux, with the added features of being both zero-config and composable. These stores are very light-weight and are actually fully compatible with time traveling - including undo/redo and replayable actions.

The main problems we encountered in Redux were with [Reselect](https://github.com/reduxjs/reselect)'s peformance, [Redux Saga](https://redux-saga.js.org/)'s ... everything, and Redux's general indirection.

Having no control over selector evaluation was Redux's biggest performance bottleneck for us. Zedux's atomic model naturally fixes this. For example, take a large selector tree:

```ts
// Reselect:
const getEntities = (state: RootState) => state.entities
const getFruits = createSelector(getEntities, entities => entities.fruits)
const getApples = createSelector(getFruits, fruits => fruits.apples)

const getRipeApples = createSelector(getApples, apples =>
  apples.filter(apple => apple.isRipe)
)

const getSortedApples = createSelector(getRipeApples, apples => apples.sort())

// Zedux:
const entities = atom('entities', () => ({}))
const getFruits = ({ get }: AtomGetters) => get(entities)
const getOranges = ({ select }: AtomGetters) => select(getFruits)

const getRipeOranges = ({ select }: AtomGetters) =>
  select(getOranges).filter(orange => orange.isRipe)

const getSortedOranges = ({ select }: AtomGetters) =>
  select(getRipeOranges).sort()
```

If the tree and derived data get intensive, there's no way to make a selector in the middle of the tree debounce/throttle/buffer updates with Reselect. There are workarounds (we used several) at the cost of more indirection.

In Zedux, you can turn any selector anywhere in the tree into an atom:

```ts
// before:
const getRipeOranges = ({ select }: AtomGetters) =>
  select(getOranges).filter(orange => orange.isRipe)

// after (ions are a type of atom specializing in selection):
const ripeOrangesAtom = ion('ripeOranges', ({ select }) => {
  const oranges = select(getOranges)
  const store = injectStore()

  // a simple debounce:
  injectEffect(() => {
    const handle = setTimeout(
      () => store.setState(oranges.filter(orange => orange.isRipe)),
      1000
    )

    return () => clearTimeout(handle)
  }, [oranges])

  return store
})
```

Zedux's injectors are just like React hooks, but for atoms. Yep. There's an [`injectMemo()`](https://omnistac.github.io/zedux/docs/api/injectors/injectMemo), [`injectRef()`](https://omnistac.github.io/zedux/docs/api/injectors/injectRef), etc. [`injectEffect()`](https://omnistac.github.io/zedux/docs/api/injectors/injectEffect) behaves exactly like React's `useEffect()`. The entire debounce operation can be abstracted to a custom injector too, reducing the code to simply:

```ts
const ripeOrangesAtom = ion('ripeOranges', ({ select }) =>
  // an example injector that handles everything in the previous example:
  injectDebouncedFilter(select(getOranges), orange => orange.isRipe)
)
```

This example also demonstrated the efficiency of Zedux's side effects model. Comparing it to Redux Saga or any Redux side effects model is like comparing apples to oranges (surely you knew that was coming) so I'm not gonna try here.

Colocating state and its side effects is the dream we've all had for a long time in the React world. Turns out `injectEffect()` just demonstrated exactly that. This was the 2nd most important feature for us coming from Redux Saga.

The 3rd problem was Redux's infamous indirection. To trace an event, you have to globally-grep your codebase for string action types and explore the usages to find what you need. Zedux introduces [atom exports](https://omnistac.github.io/zedux/docs/walkthrough/atom-apis#exports) which give you automatic go-to-definition and find-all-references support in VS Code, not to mention you write less code, colocate callbacks with state, and get automatic TypeScript support.

## Atoms

Atoms control the lifecycle and visibility of state. They give you a place to create side effects, callbacks, and suspense promises and manage resource destruction. They also enable Zedux's powerful DI model (similar to [Modules](https://angular.io/guide/architecture-modules) in Angular).

Here's another simple example of state + side effect colocation:

```ts
import { atom, injectEffect, injectStore } from '@zedux/react'

const counterAtom = atom('counter', () => {
  const store = injectStore()

  injectEffect(() => {
    const handle = setInterval(() => store.setState(state => state + 1), 1000)

    return () => clearInterval(handle)
  }, [])

  return store
})
```

The `atom()` factory returns an "atom template". Zedux uses this to dynamically create atoms (or "atom instances" as we call them). These atom instances are created when the template is used e.g. in a React component:

```tsx
function Counter() {
  const [count, setCount] = useAtomState(counterAtom)

  return (
    <div>
      Count: {count} <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}
```

The side effect kicks off as soon as a counter atom is instantiated from the `counterAtom` template. [`useAtomState()`](https://omnistac.github.io/zedux/docs/api/hooks/useAtomState) is similar to React's `useState()` hook. It subscribes to updates in the counter atom instance's store.

This effect also cleans up after itself when the atom is destroyed. Besides the colocation, Zedux's side effects model also encourages decoupling side effects from React components - as most side effects should be.

The atomic model of Zedux is inspired by Recoil and Jotai (the latter of which was in turn inspired by Zustand). We created it after trialing these other tools and determining they weren't stable or powerful enough for what we needed at Omnistac.

Zedux is more powerful than its atomic predecessors and it isn't close. It boasts many new features like [atom exports](https://omnistac.github.io/zedux/docs/walkthrough/atom-apis#exports), [real DI](https://omnistac.github.io/zedux/docs/walkthrough/overrides), [query atoms](https://omnistac.github.io/zedux/docs/walkthrough/query-atoms), [evaluation tracing](https://omnistac.github.io/zedux/docs/walkthrough/side-effects#injectwhy), [React context control](https://omnistac.github.io/zedux/docs/walkthrough/react-context), [cache management](https://omnistac.github.io/zedux/docs/walkthrough/destruction), [recursive atoms](https://omnistac.github.io/zedux/docs/advanced/more-patterns#recursive-atoms), and stable [side effects](https://omnistac.github.io/zedux/docs/api/injectors/injectEffect) and [plugins](https://omnistac.github.io/zedux/docs/advanced/plugins) models, just to name a few (yes, there's a lot more).

The biggest differences conceptually are:

1. Zedux separates the state management layer (stores) from the architecture layer (atoms). This is the secret behind Zedux's powerful DI.
2. Zedux atoms always evaluate synchronously. This keeps asynchrony out of the atom graph and gives you complete control over it. Zedux has especially good interoperability with RxJS and websockets. It also supports suspense.

The automatic promise cascading of [Recoil](https://recoiljs.org/docs/guides/asynchronous-data-queries/) and [Jotai](https://jotai.org/docs/guides/async) sounds cool - and can be cool, don't ge me wrong. However, in my experience, it is one of the main points of confusion for newcomers to the atomic model. It also makes controlling big selector graphs difficult (just like in Reselect).

Turns out, that feature is not a requirement for the atomic model to work. A synchronous atom graph is _much_ simpler to reason about _and_ gives you more control. If you found the atomic model confusing or unapproachable before, you may have a very different experience with Zedux.

## Cache Management

We loved [React Query](https://tanstack.com/query/latest/docs/react/overview). Really, it's a great tool. The downsides **for us** were the lack of first-class socket support, the tight-coupling of side effects to React components, and, really, the community that seems insistent on downsizing UI state management to the bare minimum (not an option in our UI-state-intensive applications).

We didn't need any of React Query's pagination/infinite scroll/etc helpers. But we loved React Query's cache management ideas. We gave atoms the capability of managing promise state, which gave us all the React Query-esque power we needed. Combined with injectors, this model has the potential to support everything React Query can do. Add to that Zedux's powerful DI and natural decoupling from components, and there is a _lot_ of potential for some powerful cache management. We may just make a `@zedux/query` package someday. But I digress.

Zedux's [Ecosystems](https://omnistac.github.io/zedux/docs/walkthrough/ecosystems) are patterned after React Query's [QueryClient](https://tanstack.com/query/latest/docs/react/reference/QueryClient). These are isolated atom environments that are usable and testable completely outside React and easily plugged into React via an [`<EcosystemProvider>`](https://omnistac.github.io/zedux/docs/api/components/EcosystemProvider).

```ts
const ecosystem = createEcosystem({ id: 'root' })
const instance = ecosystem.getInstance(counterAtom)

instance.getState()
instance.store.subscribe(newState => console.log('state changed:', newState))

instance.setState(100)
```

Zedux atoms can be given a [TTL](https://omnistac.github.io/zedux/docs/walkthrough/destruction#instance-destruction) (Time To Live), which is patterned after React Query's `cacheTime`. This applies to all atoms, not just query atoms, meaning you have this powerful cache management for your UI state too.

Zedux atoms can also be given params. These actually work _exactly_ like query params in React Query. Different sets of params create different atom instances of an atom template. Reusing the same params (according to a [deterministic hash](https://tanstack.com/query/latest/docs/react/guides/query-keys#query-keys-are-hashed-deterministically)) tells Zedux to reuse a cached atom instance.

```tsx
import { api, atom } from '@zedux/react'

// a `fetch` wrapper complete with promise state management and destruction
const fetcherAtom = atom(
  'fetcher',
  (url: string) => api(fetch(url).then(data => data.json())),
  {
    ttl: 60000, // keep stale instances around for 1 minute.
  }
)

function FetchTwoUsers() {
  // create 2 different atom instances of the `fetcherAtom` template:
  const { isLoading, data: joe } = useAtomValue(fetcherAtom, ['/users/joe'])
  const { isLoading, data: bob } = useAtomValue(fetcherAtom, ['/users/bob'])
  ...
}
```

When the `FetchTwoUsers` component unmounts (assuming it's the only place where the `fetcherAtom` template is used with these exact params), both of these atoms will become stale. If the component remounts within 1 minute, they'll be revived, otherwise they'll be destroyed 1 minute after the component unmounts.

In Zedux, atoms go stale as soon as they're no longer in use. There are several ways to force invalidation, reevaluation, and destruction. Check out [the docs](https://omnistac.github.io/zedux/docs/walkthrough/query-atoms) for more info.

Zedux atoms excel at managing both UI data (like Zustand and Redux) and server data (like React Query). The automatic integration between both types of state is a huge plus. **However**, Zedux is not (currently) a full replacement for React Query - it doesn't provide any pagination/refetch/etc helpers out of the box. It is possible to dual-wield both tools like many people do with Zustand + React Query. So. Do you dare wield that much power?

## Combo Deal

To sum up all these comparisons (and more that I could make but will spare you the melodrama), Zedux is the result of 5+ years of studying the React state management ecosystem. We borrowed (yes, _borrowed_) ideas from dozens of tools and put them all together into one powerhouse of a state management library.

You can think of Zedux atoms as a cross between Recoil's `atom`, `atomFamily`, `selector`, and `selectorFamily`, a simplistic version of React Query's queries and mutations, with every capability of Redux and Jotai in there too and then some.

Zedux is brand new to the open-source scene. No community plugins exist for it yet, but the potential is sky high. We crafted a uniquely powerful foundation with [standardized state primitives](http://localhost:3000/zedux/docs/about/introduction#standardized-primitives) and [plugin](http://localhost:3000/zedux/docs/advanced/plugins) support that make it capable of everything any other tool can do and then some. While it's a top contender out of the box, its full potential has not even been realized in all aspects yet.

## Design Considerations

All APIs in Zedux were created in TypeScript from the ground up. Zedux exports lots of [utility types](https://omnistac.github.io/zedux/docs/advanced/typescript-tips) for working with atoms and stores. The docs give several tips for TS users and the API docs include full type defs for the adventurous.

On top of this, we accounted for many things with Zedux from the very beginning:

- Minimal boilerplate (yes, even less than Redux Toolkit). Zero config. Plug and play.

- Scalable performance.

- Granular control over selector evaluation, memoization details, and component rerenders.

- Total control over state Time To Live and destruction.

- Full, easy control over side effects - especially good RxJS support.

- Incrementally adoptable - we needed to dual-wield Redux and Zedux for a while before we finished migrating to Zedux.

- Lazy-loading support - especially the ability to stream and cache data on-demand.

- Conducive to micro frontend architectures (really, if your app uses code splitting, you may find Zedux is a joy to work with).

- Able to take advantage of React context to control state in different component branches.

- Testable. You can use Zedux completely outside React.

- SSR-compatible.

- Time travel debugging, including replayable actions and undo/redo.

- Plugin compatible - there are many, many ways to extend Zedux's functionality - from extending its classes to creating custom injectors to creating a full-fledged ecosystem [plugin](https://omnistac.github.io/zedux/docs/advanced/plugins).

Plus many, many considerations with specific APIs - including consistent naming conventions, TS support, and keeping the learning curve as small as possible.

Alright, if you want more wordy stuff, check out the [introduction](https://omnistac.github.io/zedux/docs/about/introduction). Or if you want to really learn Zedux, dig into the [quick start](https://omnistac.github.io/zedux/docs/advanced/more-patterns#recursive-atoms) or the [examples](https://omnistac.github.io/zedux/examples).

## Final thoughts

If you're a React dev, you're no stranger to the morass of state management tooling that we've accumulated over the last 8 years or so. I'm sure you've long-since decided that you're sick of it. What we have is good enough. We don't need to complicate state management any further.

![My React state manager is better than yours](https://i.imgflip.com/7j9721.jpg)

Well, I'd almost like to believe that if a truly amazing tool came along, we would set aside our differences and rejoice that our lives just got a little easier. But such a belief would discredit our differences. Our differences give us a lot to teach each other. Critiquing is great - it stimulates progress. If I could ask one favor though: Be kind (not to me! You can tear me to pieces. Just pretty please don't go rip into Redux after reading this 🙏).

So is Zedux the one we've all been waiting for? Well, sadly, there is no silver bullet. But if you've read this far, there is a decent chance that it's the state manager _you've_ been waiting for.

Either way, that's the wrong question. The next generation of React state management tooling is here. The real question is: What are you going to build with it?
