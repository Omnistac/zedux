# `@zedux/atoms`

The core atomic model of Zedux. This is a standalone package, meaning it's the only package you need to install to use Zedux's atomic model. It includes the Zedux core store package as well as all APIs related to atoms and ecosystems.

This package is framework-independent, though many of its APIs are heavily inspired by React.

If you're new to Zedux, you're probably looking for [the quick start](https://omnistac.github.io/zedux/docs/walkthrough/quick-start).

## Installation

```sh
npm install @zedux/atoms # npm
yarn add @zedux/atoms # yarn
pnpm add @zedux/atoms # pnpm
```

If you're using React, you probably want to install the [`@zedux/react` package](https://www.npmjs.com/package/@zedux/react) instead, which includes everything from this package and more.

This package has a direct dependency on the [`@zedux/core` package](https://www.npmjs.com/package/@zedux/core). If you install that directly, ensure its version exactly matches your `@zedux/atoms` version to prevent installing duplicate packages.

## Usage

See the [top-level README](https://github.com/Omnistac/zedux) for a general overview of Zedux.

See the [Zedux documentation](https://omnistac.github.io/zedux) for comprehensive usage details.

Basic example:

```tsx
import { atom, createEcosystem } from '@zedux/atoms'

const greetingAtom = atom('greeting', 'Hello, World!')
const ecosystem = createEcosystem({ id: 'root' })

const instance = ecosystem.getInstance(greetingAtom)

instance.store.subscribe(newState => console.log('state updated:', newState))

instance.setState('Goodbye, World!')
```

## Exports

This package includes and re-exports everything from the following package:

- [`@zedux/core`](https://www.npmjs.com/package/@zedux/core)

On top of these, `@zedux/atoms` exports the following APIs:

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

## For Authors

If your lib only uses APIs in this package, it's recommended to only import this package, not `@zedux/react`. It's recommended to use a peer dependency + dev dependency on this package.

## Contributing, License, Etc

See the [top-level README](https://github.com/Omnistac/zedux) for all the technical stuff.
