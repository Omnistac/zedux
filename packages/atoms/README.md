# `@zedux/atoms`

The core atomic model of Zedux. This is a standalone package, meaning it's the only package you need to install to use Zedux's atomic model. It includes all APIs related to signals, atoms, and ecosystems.

This package is framework-independent, though many of its APIs are heavily inspired by React.

If you're new to Zedux, you're probably looking for [the quick start](https://omnistac.github.io/zedux/docs/walkthrough/quick-start).

## Installation

```sh
npm install @zedux/atoms # npm
yarn add @zedux/atoms # yarn
pnpm add @zedux/atoms # pnpm
```

If you're using React, you probably want to install the [`@zedux/react` package](https://www.npmjs.com/package/@zedux/react) instead, which includes everything from this package and more.

## Usage

See the [top-level README](https://github.com/Omnistac/zedux) for a general overview of Zedux.

See the [Zedux documentation](https://omnistac.github.io/zedux) for comprehensive usage details.

Basic example:

```tsx
import { atom, createEcosystem } from '@zedux/atoms'

const greetingAtom = atom('greeting', 'Hello, World!')
const ecosystem = createEcosystem({ id: 'root' })

const instance = ecosystem.getNode(greetingAtom)

instance.on('change', ({ newState }) => console.log('state updated:', newState))
instance.set('Goodbye, World!')
instance.destroy()
```

## Exports

`@zedux/atoms` exports the following APIs and many helper types for working with them in TypeScript:

### Classes

- [`AtomApi`](https://omnistac.github.io/zedux/docs/api/classes/AtomApi)
- [`AtomInstance`](https://omnistac.github.io/zedux/docs/api/classes/AtomInstance)
- [`AtomTemplate`](https://omnistac.github.io/zedux/docs/api/classes/AtomTemplate)
- [`AtomTemplateBase`](https://omnistac.github.io/zedux/docs/api/classes/AtomTemplateBase)
- [`Ecosystem`](https://omnistac.github.io/zedux/docs/api/classes/Ecosystem)
- [`IonTemplate`](https://omnistac.github.io/zedux/docs/api/classes/IonTemplate)
- [`MappedSignal`](https://omnistac.github.io/zedux/docs/api/classes/MappedSignal)
- [`SelectorInstance`](https://omnistac.github.io/zedux/docs/api/classes/SelectorInstance)
- [`Signal`](https://omnistac.github.io/zedux/docs/api/classes/Signal)

### Factories

- [`api()`](https://omnistac.github.io/zedux/docs/api/factories/api)
- [`atom()`](https://omnistac.github.io/zedux/docs/api/factories/atom)
- [`createEcosystem()`](https://omnistac.github.io/zedux/docs/api/factories/createEcosystem)
- [`ion()`](https://omnistac.github.io/zedux/docs/api/factories/ion)

### Injectors

- [`injectAtomGetters()`](https://omnistac.github.io/zedux/docs/api/injectors/injectAtomGetters)
- [`injectAtomInstance()`](https://omnistac.github.io/zedux/docs/api/injectors/injectAtomInstance)
- [`injectAtomSelector()`](https://omnistac.github.io/zedux/docs/api/injectors/injectAtomSelector)
- [`injectAtomState()`](https://omnistac.github.io/zedux/docs/api/injectors/injectAtomState)
- [`injectAtomValue()`](https://omnistac.github.io/zedux/docs/api/injectors/injectAtomValue)
- [`injectCallback()`](https://omnistac.github.io/zedux/docs/api/injectors/injectCallback)
- [`injectEcosystem()`](https://omnistac.github.io/zedux/docs/api/injectors/injectEcosystem)
- [`injectEffect()`](https://omnistac.github.io/zedux/docs/api/injectors/injectEffect)
- [`injectMappedSignal()`](https://omnistac.github.io/zedux/docs/api/injectors/injectMappedSignal)
- [`injectMemo()`](https://omnistac.github.io/zedux/docs/api/injectors/injectMemo)
- [`injectPromise()`](https://omnistac.github.io/zedux/docs/api/injectors/injectPromise)
- [`injectRef()`](https://omnistac.github.io/zedux/docs/api/injectors/injectRef)
- [`injectSelf()`](https://omnistac.github.io/zedux/docs/api/injectors/injectSelf)
- [`injectSignal()`](https://omnistac.github.io/zedux/docs/api/injectors/injectSignal)
- [`injectWhy()`](https://omnistac.github.io/zedux/docs/api/injectors/injectWhy)

### Utils

- [`getDefaultEcosystem()`](https://omnistac.github.io/zedux/docs/api/utils/getDefaultEcosystem)
- [`getInternals()`](https://omnistac.github.io/zedux/docs/api/utils/internal-utils#getinternals)
- [`setInternals()`](https://omnistac.github.io/zedux/docs/api/utils/internal-utils#setinternals)
- [`untrack()`](https://omnistac.github.io/zedux/docs/api/utils/internal-utils#untrack)

## For Authors

If your lib only uses APIs in this package, it's recommended to only import this package, not `@zedux/react`. It's recommended to use a peer dependency + dev dependency on this package.

## Contributing, License, Etc

See the [top-level README](https://github.com/Omnistac/zedux) for all the technical stuff.
