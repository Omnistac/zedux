# Zedux

[![Build Status](https://travis-ci.org/bowheart/zedux.svg?branch=master)](https://travis-ci.org/bowheart/zedux)
[![Test Coverage](https://api.codeclimate.com/v1/badges/0459ebf8444c36752eac/test_coverage)](https://codeclimate.com/github/bowheart/zedux/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/0459ebf8444c36752eac/maintainability)](https://codeclimate.com/github/bowheart/zedux/maintainability)
[![npm](https://img.shields.io/npm/v/zedux.svg)](https://www.npmjs.com/package/zedux)

A Molecular State Engine for React.

Zedux is a multi-paradigm state management tool that features a powerful composable store model wrapped in a DI-driven atomic architecture.

## Installation

Install using npm, yarn, etc. E.g.:

```bash
yarn add @zedux/react
```

The React package (`@zedux/react`) contains everything you need - the core store model, the core atomic model, and the React-specific APIs.

`@zedux/react` has a peer dependency on React and is compatible with React 18+ only, as it uses the new `useSyncExternalStore` hook.

## Intro

We borrowed ideas from dozens of state management tools over the past 5 years, invented a few ourselves, and put it all together in one powerhouse of a state management library.

Most notably, Zedux borrows ideas from Redux, Recoil, and React Query. Zedux takes the unique approach of separating the state layer (stores) from the architecture layer (atoms). This allows for a powerful Dependency Injection model, conceptually similar to Angular's but simpler and more dynamic.

Sound complex? Zedux is actually very beginner-friendly. In fact, here's all you need to begin:

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

We'll break down this example and so much more in [the docs](https://omnistac.github.io/zedux/docs/walkthrough/quick-start).

## Learn Zedux

To embark on the journey of mastering Zedux, jump into [the quick start](https://Omnistac.github.io/zedux/docs/walkthrough/quick-start).

If you prefer something more high-level, [the introduction's](https://omnistac.github.io/zedux/docs/about/introduction) a decent place to start. Or if you want to learn Everything Everywhere All at Once, the [API docs](https://omnistac.github.io/zedux/docs/api/api-overview) or [repo source code and tests](https://github.com/Omnistac/zedux/tree/master/packages) are real page-turners.

Happy coding!

## Contributing

Contributions an any level are absolutely welcome! Have a look at the [contribution guidelines](https://github.com/Omnistac/zedux/blob/master/CONTRIBUTING.md).

Bugs can be submitted to https://github.com/Omnistac/zedux/issues

## License

The [MIT License](https://github.com/Omnistac/zedux/blob/master/LICENSE.md).
