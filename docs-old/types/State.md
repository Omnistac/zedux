# State

A State is just a glorified [actor](/docs/types/Actor.md) &ndash; "glorified" meaning it has two optional additional methods, `enter()` and `leave()`, that define processor hooks that should be called when the state is entered or left, respectively.

## Definition

```typescript
interface State<T extends string> extends Actor<T> {
  enter?: Processor
  leave?: Processor
}
```

**enter** - Optional - A valid [processor](/docs/types/Processor.md) that will be called when the machine enters this state.

**leave** - Optional - A valid [processor](/docs/types/Processor.md) that will be called when the machine enters this state.

## Examples

Manually creating States:

```javascript
const up = () => ({ type: 'up' })
up.type = 'up'

const down = () => ({ type: 'down' })
down.type = 'down'
```

Using the [`state()` factory](/docs/api/state.md):

```javascript
import { state } from 'zedux'

const up = state('up')
const down = state('down')

up() // { type: 'up' }
down(5) // { type: 'down', payload: 5 }
```

## Notes

While there's nothing wrong with putting States together yourself, Zedux ships with a high-level api for creating them. See the [`state()` factory](/docs/api/state.md) and the [ZeduxState api](/docs/api/ZeduxState.md) for more info.
