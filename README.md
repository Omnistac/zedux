# Zedux

[![Build Status](https://github.com/Omnistac/zedux/actions/workflows/coverage.yml/badge.svg)](https://github.com/Omnistac/zedux/actions/workflows/coverage.yml)
[![codecov.io](https://codecov.io/gh/Omnistac/zedux/coverage.svg)](https://app.codecov.io/gh/Omnistac/zedux)
[![npm](https://img.shields.io/npm/v/@zedux/react.svg)](https://www.npmjs.com/package/@zedux/react)
[![license](https://shields.io/badge/license-MIT-informational)](https://github.com/Omnistac/zedux/tree/master/LICENSE.md)

A Molecular State Engine for React.

> [!NOTE]  
> Zedux v2 is right around the corner! This readme has been updated for v2, and the docs are steadily getting there. Despite documentation being sparse, it's highly recommended that new projects use the latest stable v2 release candidate. Refer to the [v2 migration guide](https://zedux.dev/docs/migrations/v2) for a v2 quick start.

Zedux is a multi-paradigm state management tool that features a powerful signals implementation wrapped in a DI-driven atomic architecture.

## Installation

```bash
npm install @zedux/react # npm
yarn add @zedux/react # yarn
pnpm add @zedux/react # pnpm
```

The React package (`@zedux/react`) contains everything you need to use Zedux in a React app - the [core atomic model](https://www.npmjs.com/package/@zedux/atoms) and all React-specific APIs.

`@zedux/react` has a peer dependency on React. It has partial support for React 18, but primarily supports React 19 and up.

## Intro

We borrowed ideas from dozens of state management tools over the past 5 years, invented a few ourselves, and put it all together in one powerhouse of a state management library.

Think of Zedux as a cross between React Query, Valtio, and Recoil/Jotai + Bunshi. It's both a cache manager and a normal state manager with real Dependency Injection, rich events, opt-in mutation proxying, and an extension model patterned after React itself.

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

Bugs can be reported [here](https://github.com/Omnistac/zedux/issues).

Questions, feature requests, ideas, and links to cool projects or examples are always welcome in the [discussions page](https://github.com/Omnistac/zedux/discussions).

## License

The [MIT License](https://github.com/Omnistac/zedux/blob/master/LICENSE.md).
