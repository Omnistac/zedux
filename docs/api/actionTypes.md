# `actionTypes`

There are a few action types that Zedux uses internally. While there should never be any reason for you to use these types, you may see them show up in your inspectors. They are listed here for your information.

## Properties

### `HYDRATE`

Zedux dispatches this action to the store in two scenarios:

1. When the store's [`.hydrate()`](/docs/api/Store.md#storehydrate) method is called.

2. When an [inducer](/docs/types/Inducer.md) is dispatched to the store.

#### Usage

```javascript
import { actionTypes } from 'zedux'

const { HYDRATE } = actionTypes
```

### `RECALCULATE`

Zedux dispatches this action to the store when the store's reactor hierarchy is changed via [`store.use()`](/docs/api/Store.md#storeuse).

#### Usage

```javascript
import { actionTypes } from 'zedux'

const { RECALCULATE } = actionTypes
```
