# `@zedux/machines`

> IMPORTANT: This readme has not yet been updated for the Zedux v2 signal-based implementation of the `@zedux/machines` package. That will happen after the v2 versions of all linked docs pages have been merged to the docs site.

A simple, TypeScript-first state machine implementation for Zedux. This is an addon package, meaning it doesn't have any own dependencies or re-export any APIs from other packages. It uses peer dependencies instead, expecting you to download the needed packages yourself.

See [the documentation](https://omnistac.github.io/zedux/docs/packages/machines/overview) for this package.

## Installation

This package has a peer dependency on the [`@zedux/atoms`](https://www.npmjs.com/package/@zedux/atoms) package. Ensure that `@zedux/atoms` is installed at the same version as this package:

```sh
npm install @zedux/atoms @zedux/machines # npm
yarn add @zedux/atoms @zedux/machines # yarn
pnpm add @zedux/atoms @zedux/machines # pnpm
```

The `@zedux/react` package already includes `@zedux/atoms`. To use `@zedux/machines` in React apps, install it alongside `@zedux/react` instead:

```sh
npm install @zedux/react @zedux/machines # npm
yarn add @zedux/react @zedux/machines # yarn
pnpm add @zedux/react @zedux/machines # pnpm
```

## Usage

See [the Zedux docs](https://omnistac.github.io/zedux/docs/packages/machines/overview) for full usage details.

Simple example:

```tsx
import { injectMachineStore } from '@zedux/machines'
import { api, atom } from '@zedux/react'

const fetcherAtom = atom('fetcher', () => {
  const store = injectMachineStore(state => [
    // the first state is the initial state ('idle' here):
    state('idle').on('request', 'fetching'),
    state('fetching')
      .on('fetchSuccessful', 'success')
      .on('fetchFailed', 'error'),
    state('success').on('invalidate', 'fetching'),
    state('error').on('retry', 'fetching'),
  ])

  return store
})
```

## Exports

This package exports the following APIs along with several TypeScript types for working with them:

### Classes

- [`MachineStore`](https://omnistac.github.io/zedux/docs/packages/machines/MachineStore)

### Injectors

- [`injectMachineStore()`](https://omnistac.github.io/zedux/docs/packages/machines/injectMachineStore)

## Contributing, License, Etc

See the [top-level README](https://github.com/Omnistac/zedux) for all the technical stuff.
