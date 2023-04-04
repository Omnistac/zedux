# `@zedux/immer`

The official Immer integration for Zedux.

See [the documentation](https://omnistac.github.io/zedux/docs/packages/immer) for this package.

## Installation

This package has a peer dependency on the [`@zedux/core-atoms`](https://www.npmjs.com/package/@zedux/core-atoms) package. Ensure that that's installed at the same version as this package:

```sh
npm install @zedux/core-atoms @zedux/immer # npm
yarn add @zedux/core-atoms @zedux/immer # yarn
pnpm add @zedux/core-atoms @zedux/immer # pnpm
```

The `@zedux/react` package includes `@zedux/core-atoms` but does **not** include this package. So if you want Immer functionality, install this package alongside `@zedux/react`:

```sh
npm install @zedux/react @zedux/immer # npm
yarn add @zedux/react @zedux/immer # yarn
pnpm add @zedux/react @zedux/immer # pnpm
```

## Usage

See [the Zedux docs](https://omnistac.github.io/zedux/docs/packages/immer) for full usage details.

Simple example:

```tsx
import { injectImmerStore } from '@zedux/immer'
import { api, atom } from '@zedux/react'

const loginFormAtom = atom('loginForm', () => {
  const store = injectImmerStore({ email: '', password: '' })

  return api(store).setExports({ produce: store.produce })
})

function LoginForm() {
  const [state, { produce }] = useAtomState(loginFormAtom)

  return (
    <>
      <input
        onChange={event =>
          produce(state => {
            state.email = event.target.value
          })
        }
        value={state.email}
      />
      <input
        onChange={event =>
          produce(state => {
            state.password = event.target.value
          })
        }
        type="password"
        value={state.password}
      />
    </>
  )
}
```

## Exports

This package exports the following APIs:

### Classes

- [`ImmerStore`](https://omnistac.github.io/zedux/docs/packages/immer#immerstore)

### Factories

- [`createImmerStore()`](https://omnistac.github.io/zedux/docs/packages/immer#createimmerstore)

### Injectors

- [`injectImmerStore()`](https://omnistac.github.io/zedux/docs/packages/immer#injectimmerstore)

## Contributing, License, Etc

See the [top-level README](https://github.com/Omnistac/zedux) for all the technical stuff.
