# `@zedux/immer`

The official [Immer](https://github.com/immerjs/immer) integration for Zedux. This is an addon package, meaning it doesn't have any own dependencies or re-export any APIs from other packages. It uses peer dependencies instead, expecting you to download the needed packages yourself.

See [the documentation](https://omnistac.github.io/zedux/docs/packages/immer) for this package.

## Installation

This package has a peer dependency on the [`@zedux/atoms`](https://www.npmjs.com/package/@zedux/atoms) package and on Immer itself. Ensure that `@zedux/atoms` is installed at the same version as this package:

```sh
npm install immer @zedux/atoms @zedux/immer # npm
yarn add immer @zedux/atoms @zedux/immer # yarn
pnpm add immer @zedux/atoms @zedux/immer # pnpm
```

The `@zedux/react` package already includes `@zedux/atoms`. To use Immer in React apps, install this package alongside `@zedux/react` instead:

```sh
npm install immer @zedux/react @zedux/immer # npm
yarn add immer @zedux/react @zedux/immer # yarn
pnpm add immer @zedux/react @zedux/immer # pnpm
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
