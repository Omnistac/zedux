# `compose()`

This is just a functional programming utility that Zedux provides for convenience. It takes a list of functions and returns a function that "composes" the given arguments from right-to-left. Thus:

```javascript
compose(f, g, h)(x)
```

is equivalent to

```javascript
f(g(h(x)))
```

The input of each function is the output of the function to its right. Each function but the last should therefore accept only 1 argument. The last function (which will be called first) may have multiple arguments as it determines the function signature of the resulting, composed function.

`compose()` is typically used to string together single-argument functions whose input and output are the same type. Some example function signatures:

```javascript
State => State

Component => Component

TodosList => TodosList
```

## Definition

```typescript
<C = (...args: any[]) => any>(...funcs: Function[]) => C
```

**funcs** - Any number of functions to compose together. If no arguments are passed, returns the identity function. If one function is passed, returns it as-is. Two or more functions will be composed together right-to-left.

## Examples

Used to create composite [inducers](/docs/types/Inducer.md)

```javascript
import { compose } from 'zedux'
import { buyWeapon, spendGold } from './inducerFactories'
import store from './store'

/*
  Since inducers have the signature
    State => State
  they are very easy to compose together:
*/
const buyAndSpend = compose(
  buyWeapon,
  spendGold
)

store.dispatch(buyAndSpend)
```
