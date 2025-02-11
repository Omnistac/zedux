# `@zedux/react`

The official React bindings for Zedux. This is a standalone package, meaning it's the only package you need to install in a React app. It includes the Zedux store and atomic packages as well as all of Zedux's React components and hooks.

If you're new to Zedux, you're probably looking for [the quick start](https://omnistac.github.io/zedux/docs/walkthrough/quick-start).

## Installation

```sh
npm install @zedux/react # npm
yarn add @zedux/react # yarn
pnpm add @zedux/react # pnpm
```

This package has a direct dependency on the [`@zedux/atoms` package](https://www.npmjs.com/package/@zedux/atoms), which in turn has a direct dependency on the [`@zedux/core` package](https://www.npmjs.com/package/@zedux/core). If you install any of those directly, ensure their versions exactly match your `@zedux/react` version to prevent installing duplicate packages.

## Usage

See the [top-level README](https://github.com/Omnistac/zedux) for a general overview of Zedux.

See the [Zedux documentation](https://omnistac.github.io/zedux) for comprehensive usage details.

Basic example:

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

## Exports

This package includes and re-exports everything from the following packages:

- [`@zedux/core`](https://www.npmjs.com/package/@zedux/core)
- [`@zedux/atoms`](https://www.npmjs.com/package/@zedux/atoms)

On top of these, `@zedux/react` exports the following APIs:

### Components

- [`<AtomProvider>`](https://omnistac.github.io/zedux/docs/api/components/AtomProvider)
- [`<EcosystemProvider>`](https://omnistac.github.io/zedux/docs/api/components/EcosystemProvider)

### Hooks

- [`useAtomContext()`](https://omnistac.github.io/zedux/docs/api/hooks/useAtomContext)
- [`useAtomInstance()`](https://omnistac.github.io/zedux/docs/api/hooks/useAtomInstance)
- [`useAtomSelector()`](https://omnistac.github.io/zedux/docs/api/hooks/useAtomSelector)
- [`useAtomState()`](https://omnistac.github.io/zedux/docs/api/hooks/useAtomState)
- [`useAtomValue()`](https://omnistac.github.io/zedux/docs/api/hooks/useAtomValue)
- [`useEcosystem()`](https://omnistac.github.io/zedux/docs/api/hooks/useEcosystem)

### Utils

- [`inject()`](https://omnistac.github.io/zedux/docs/api/utils/inject)

## For Authors

The [Zedux documentation](https://omnistac.github.io/zedux) assumes you are using this package. Plugin and integration authors may want to depend directly on [`@zedux/core`](https://www.npmjs.com/package/@zedux/core) or [`@zedux/atoms`](https://www.npmjs.com/package/@zedux/atoms). However, if your package uses any of these React-specific APIs, it is recommended to only import this `@zedux/react` package.

## Contributing, License, Etc

See the [top-level README](https://github.com/Omnistac/zedux) for all the technical stuff.
