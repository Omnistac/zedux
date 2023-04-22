# `@zedux/core`

This package includes the core composable store model of Zedux. It exports several utilities and TypeScript types for working with Zedux stores.

This package is framework-independent.

If you're new to Zedux, you're probably looking for [the quick start](https://omnistac.github.io/zedux/docs/walkthrough/quick-start).

## Installation

```sh
npm install @zedux/core # npm
yarn add @zedux/core # yarn
pnpm add @zedux/core # pnpm
```

If you're using React, you probably want to install the [`@zedux/react` package](https://www.npmjs.com/package/@zedux/react) instead, which includes everything from this package, everything from the [`@zedux/atoms` package](https://www.npmjs.com/package/@zedux/atoms), and more.

## Usage

See the [top-level README](https://github.com/Omnistac/zedux) for a general overview of Zedux.

See the [Zedux documentation](https://omnistac.github.io/zedux) for comprehensive usage details.

Basic example:

```tsx
import { createStore } from '@zedux/core'

// a zero-config store:
const store = createStore(null, 'Hello, World!')

const subscription = store.subscribe((newState, oldState) => {
  console.log('store went from', oldState, 'to', newState)
})

store.getState() // 'Hello, World!'
store.setState('Goodbye, World!')
```

## Exports

This package exports the following APIs, along with many TypeScript types for working with them:

### Classes

- [`Store`](https://omnistac.github.io/zedux/docs/api/classes/Store)

### Factories

- [`actionFactory()`](https://omnistac.github.io/zedux/docs/api/factories/actionFactory)
- [`createReducer()`](https://omnistac.github.io/zedux/docs/api/factories/createReducer)
- [`createStore()`](https://omnistac.github.io/zedux/docs/api/factories/createStore)

### Utils

- [`getMetaData()`](https://omnistac.github.io/zedux/docs/api/utils/action-chain-utils#getmetadata)
- [`removeAllMeta()`](https://omnistac.github.io/zedux/docs/api/utils/action-chain-utils#removeallmeta)
- [`removeMeta()`](https://omnistac.github.io/zedux/docs/api/utils/action-chain-utils#removemeta)
- [`internalTypes`](https://omnistac.github.io/zedux/docs/api/utils/internalTypes)
- [`is()`](https://omnistac.github.io/zedux/docs/api/utils/is)

## For Authors

If your lib only use APIs in this package, it's recommended to only import this package, not `@zedux/atoms` or `@zedux/react`. This package is small enough that you _may_ consider bundling it in with your code, but that shouldn't be necessary. It's usually recommended to use a peer dependency + dev dependency on this package.

## Contributing, License, Etc

See the [top-level README](https://github.com/Omnistac/zedux) for all the technical stuff.
