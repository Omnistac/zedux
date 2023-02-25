# Zedux

[![Build Status](https://travis-ci.org/bowheart/zedux.svg?branch=master)](https://travis-ci.org/bowheart/zedux)
[![Test Coverage](https://api.codeclimate.com/v1/badges/0459ebf8444c36752eac/test_coverage)](https://codeclimate.com/github/bowheart/zedux/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/0459ebf8444c36752eac/maintainability)](https://codeclimate.com/github/bowheart/zedux/maintainability)
[![npm](https://img.shields.io/npm/v/zedux.svg)](https://www.npmjs.com/package/zedux)

A Molecular State Engine for React.

Zedux is a multi-paradigm state management tool that features a powerful composable store model wrapped in a DI-driven atomic architecture.

## Feature list of awesomeness

- Atomic architecture
- Composable stores
- Dependency Injection
- Zero-config
- Cache management
- Unrestricted side effects
- Action streams
- Familiar APIs
- Graph insights & dev tools

## Installation

Install using npm or yarn. E.g.:

```bash
yarn add @zedux/react
```

The React package (`@zedux/react`) contains everything you need - the core store model, the core atomic model, and the React-specific APIs.

`@zedux/react` has a peer dependency on React and is compatible with React 18+ only, as it uses the new `useSyncExternalStore` hook.

## Intro

We borrowed ideas from dozens of state management tools over the past 5 years, invented a few ourselves, and put it all together in one powerhouse of a state management library.

Most notably, Zedux borrows ideas from Redux, Recoil, React Query, and React itself. Zedux improves upon flux by separating the state layer (stores) from the architecture layer (atoms). This allows for a powerful DI model, conceptually similar to Angular's but much easier to use and more dynamic.

Sound complex? Zedux is actually very beginner-friendly. In fact, here's all you need to begin:

```tsx
import { atom, useAtomState } from '@zedux/react'

const greetingAtom = atom('greeting', 'Hello, World!')

function Greeting() {
  const [greeting, setGreeting] = useAtomState(greetingAtom)

  return (
    <div>
      <div>{greeting}</div>
      <input
        onChange={event => setGreeting(event.target.value)}
        value={greeting}
      />
    </div>
  )
}
```

This example contains everything you need to know to start using Zedux. We'll break down this example and so much more in [the docs](https://omnistac.github.io/zedux/docs/walkthrough/quick-start).

## Project Goals

1. Flexibility.
2. Depth.
3. Simplicity.

### Flexibility

The core philosophy of Zedux. Atoms and stores are flexible, meaning they can adapt to every use case. Need more power? Build a reducer hierarchy. Need some simple, local state? Use zero config stores. Need something even simpler? Don't use stores at all!

Apps of all sizes should be able to use Zedux comfortably. Zedux is designed to scale as your state management demands increase. Zero configuration can always be opted out of. All high-level APIs have low-level counterparts for when you need to dig in and do something crazy.

### Depth

Zedux is not just another "80%" little state management library that fills some niche and gets people excited for a while. It's a mature tool that yields greater returns the more you use it and spend time learning its features. Its extreme flexibility should allow it to handle every possible use case.

That doesn't mean you can't use other tools in combination with Zedux. For example, XState can be used for more powerful state machines.

Knowledge gained from working with Zedux is transferrable. Zedux tries to stay close to other popular libraries in the space. The atomic APIs are similar to Recoil. The store APIs are similar to Redux. The cache management tools are similar to React Query. If one day you ditch Zedux forever, you should be able to easily jump into other libraries and feel familiar with the concepts.

### Simplicity

Zero configuration and high-level APIs are standard across all features. 2 simple functions is all you need to learn to start using Zedux (see the above example).

## I Have Bundlephobia

The production build of Zedux currently weighs in at 48kb minified, 14kb minified + gzipped - very similar to other libraries in the space like Redux Toolkit and React Query.

## Learning Paths

At this point you should have a pretty good idea of what Zedux is all about. To embark on the journey of mastering Zedux, jump into [the docs](https://Omnistac.github.io/zedux). Happy coding!

## Contributing

All contributions on any level are so overwhelmingly welcome. Just jump right in. Open an issue. For PRs, just use prettier like a human and keep tests at 100% (branches, functions, lines, everything 100%, plz). Let's make this awesome!

Bugs can be submitted to https://github.com/Omnistac/zedux/issues

## License

The MIT License.
