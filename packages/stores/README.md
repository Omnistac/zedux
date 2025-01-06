# `@zedux/stores`

The composable store model of Zedux. This is an addon package with a dependency on `@zedux/atoms` and `@zedux/core`. It includes (via re-exporting) the Zedux core store package as well as all APIs related to working with stores in atoms.

This package is framework-independent and can run in any JS runtime. It's considered a "legacy" package of Zedux, since Zedux's main packages have switched to a signals-based model

If you're new to Zedux, you're probably looking for [the quick start](https://omnistac.github.io/zedux/docs/walkthrough/quick-start). You may also want to avoid this package, preferring the newer signal-based APIs in the `@zedux/react` or `@zedux/atoms` packages.

## Installation

```sh
npm install @zedux/stores # npm
yarn add @zedux/stores # yarn
pnpm add @zedux/stores # pnpm
```

If you're using React, you probably want to install the [`@zedux/react` package](https://www.npmjs.com/package/@zedux/react) alongside this package (and very likely want to skip this package altogether. Prefer signals).

This package has a direct dependency on both the [`@zedux/core` package](https://www.npmjs.com/package/@zedux/core) and [`@zedux/atoms` package](https://www.npmjs.com/package/@zedux/atoms). If you install those directly, ensure their versions exactly match your `@zedux/stores` version to prevent installing duplicate packages.

## Usage

See the [top-level README](https://github.com/Omnistac/zedux) for a general overview of Zedux.

See the [Zedux documentation](https://omnistac.github.io/zedux) for comprehensive usage details.

Basic example:

```tsx
import { atom, createEcosystem } from '@zedux/stores'

const greetingAtom = atom('greeting', 'Hello, World!')
const ecosystem = createEcosystem({ id: 'root' })

const instance = ecosystem.getInstance(greetingAtom)

instance.store.subscribe(newState => console.log('state updated:', newState))
instance.setState('Goodbye, World!')
instance.destroy()
```

## Exports

This package includes and re-exports everything from the following package:

- [`@zedux/core`](https://www.npmjs.com/package/@zedux/core)

On top of this, `@zedux/stores` exports the following APIs and many helper types for working with them in TypeScript. Note that most of these have newer, signals-based versions in the `@zedux/react` (or `@zedux/atoms`) package that you should prefer.

### Classes

- [`AtomApi`](https://omnistac.github.io/zedux/docs/api/classes/AtomApi)
- [`AtomInstance`](https://omnistac.github.io/zedux/docs/api/classes/AtomInstance)
- [`AtomTemplate`](https://omnistac.github.io/zedux/docs/api/classes/AtomTemplate)
- [`IonTemplate`](https://omnistac.github.io/zedux/docs/api/classes/IonTemplate)

### Factories

- [`api()`](https://omnistac.github.io/zedux/docs/api/factories/api)
- [`atom()`](https://omnistac.github.io/zedux/docs/api/factories/atom)
- [`ion()`](https://omnistac.github.io/zedux/docs/api/factories/ion)

### Injectors

- [`injectPromise()`](https://omnistac.github.io/zedux/docs/api/injectors/injectPromise)
- [`injectStore()`](https://omnistac.github.io/zedux/docs/api/injectors/injectStore)

## For Authors

If your lib only uses APIs in this package, it's recommended to only import this package, not `@zedux/react`. It's recommended to use a peer dependency + dev dependency on this package.

## Contributing, License, Etc

See the [top-level README](https://github.com/Omnistac/zedux) for all the technical stuff.
