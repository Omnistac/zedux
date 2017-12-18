# `metaTypes`

There are a few meta types that Zedux uses internally. While there should not normally be any reason for you to use these types, you may see them show up in your inspectors. They are listed here for your information.

## Properties

### `DELEGATE`

Zedux wraps actions in this meta node when they are received from a child store. This allows the parent store to re-dispatch one of these actions as-is and allow Zedux to delegate the actual dispatching to the relevant child store.

The philosophy here is that an action dispatched to a child store is exactly equivalent to a `DELEGATE` action dispatched to its parent store, a doubly-wrapped `DELEGATE` action dispatched to its grandparent store, etc.

#### Usage

```javascript
import { metaTypes } from 'zedux'

const { DELEGATE } = metatypes
```

### `INHERIT`

Zedux wraps actions in this meta node when they are received from a parent store. This tells Zedux not to inform the parent store about this action at all, as that's where the action originated.

Inspectors can usually safely ignore inherited actions, as it's the parent store's job to re-create the state e.g. for time travel debugging.

#### Usage

```javascript
import { metaTypes } from 'zedux'

const { INHERIT } = metatypes
```

### `SKIP_PROCESSORS`

Used internally, but available for you to use as well. Wrap an action in this meta node to instruct Zedux to skip the store's [processor layer](/docs/guides/theProcessorLayer.md). See the [optimizing performance guide](/docs/guides/optimizingPerformance.md) for more info.

#### Usage

```javascript
import { metaTypes } from 'zedux'

const { SKIP_PROCESSORS } = metatypes
```

### `SKIP_REDUCERS`

Used internally, but available for you to use as well. Wrap an action in this meta node to instruct Zedux to skip the store's [reducer layer](/docs/guides/theReducerLayer.md). See the [optimizing performance guide](/docs/guides/optimizingPerformance.md) for more info.

#### Usage

```javascript
import { metaTypes } from 'zedux'

const { SKIP_REDUCERS } = metatypes
```
