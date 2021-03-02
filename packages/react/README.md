# Atomic Architecture

## What is an atom?

An atom can be:

- a simple useState-esque state container
- a selector, deriving state from other atoms
- a function that runs an async flow/side effect
- a wrapper around a Zedux store

the factory can return:

- a normal value - will be put in a store somehow
- an observable - will be subscribed to and [TODO: the latest emission? An accumulation of all emissions?] will be stored in a store somehow
- a store
- a promise - the promise will be awaited and an internal state machine will advance to success or failure state (TODO: are retries possible?) on resolve/reject. The Promise result should be one of the three above types

when you `useAtom` an atom, it is instantiated if it hasn't been.

## does the factory function run every time a dependency updates?

no. Factory runs exactly once per atom instance.

## so .. how would an atom be notified of a dependency's updates?

Hmm.. Could make it possible to import streams. .. But then you'd be dealing with multiple subscriptions

Zedux stores solve this! If all atoms export a store, all atoms can be injected anywhere - in React or in other atoms or literally anywhere - using the same subscription model.

## how would you combine state from 2 atoms?

```ts
const addAtom = createAtom({
  key: 'add',
  factory: () => {
    const counterAtom1 = inject(counterAtom, [1])
    const counterAtom2 = inject(counterAtom, [2])

    counterAtom1.subscribe() // ..... no. Don't want to handle subscriptions manually here.

    // hmm this suffers from the same multiple-subscribers problem:
    return combineLatest(
      counterAtom1.getState$(),
      counterAtom2.getState$()
    ).pipe(map(([a, b]) => a + b))
  },
})
```

so stores it is

```ts
const addAtom = createAtom({
  key: 'add',
  factory: () => {
    const counterStore1 = inject(counterAtom, [1])
    const counterStore2 = inject(counterAtom, [2])

    return combineLatest(from(counterStore1), from(counterStore2)).pipe(
      map(([a, b]) => a + b)
    )
  },
})
```

## what do local atoms look like?

```tsx
const Child = () => {}

const Parent = () => {
  const localAtom = someLocalAtom.useAtom() // is some id required?

  return (
    <LocalProvider atom={localAtom}>
      <Child />
    </LocalProvider>
  )
}
```

## TODO: how would you subscribe, receive all past events, and then continue listening to future ones

## TODO: how does cleanup work? If e.g. a factory function has subscriptions to clean up when its atom instance is destroyed.

could be solved with Zedux stores - e.g. a store could have a `destroy` method that triggers a `effectType: DESTROY` effect that can be hooked into.

## can the factory run in a react context?

no. Def no for app or global atoms. Local atoms could. Would a special local-atoms-only api make sense for that?

## TODO: timeout for async atoms - throw error for React error boundaries to catch.

## Zedux todos:

- fix createActor types (DONE)
- add createStore overload with initialState
- remove { error } from dispatch result
- fix Subscriber overloads
- emit current state on observablified stores
- disallow extra keys in returned state in `.reduce()`

# Internal Structure

## `globalStore`

This export holds all the state Zedux needs to function. Do not modify this directly. DevTool components can hook into this (read-only!) to provide information about the whole Zedux ecosystem for debugging and dev X features.

Its structure is:

```ts
globalStoreState = {
  atoms: {
    'some-global-atom-key': {
      implementations: {
        // 'im' stands for 'implementation' - these are internally generated ids
        'im-0': GlobalAtom,
        'im-1': GlobalAtom // different implementations should not change the scope (to GlobalAtom or LocalAtom in this case) - will log error
      },
      instances: {
        'in-0': {
          addSubscriber: (subscriber: Subscriber<T>) => () => void, // TODO: maybe Zedux could propagate an effect on subscribe
          dependencies: [],
          key: 'some-global-atom-key',
          metaStore: Store<AtomMetadata<T>>,
          stateStore?: Store<T>,
          ttl?: number | Observable<any>,
        },
        'in-1': AtomInstance
      },
      overrides: {
        // 'ov' stands for 'override' - these are internally generated ids
        'ov-0': GlobalAtom // scope shouldn't change here either
      }
    },
    'some-local-atom-key': {
      implementations: { ... },
      instances: {
        'in-0': AtomInstance
      }
    }
  },
  molecules: {
    // molecules can't be overridden (DI) or have multiple implementations or instantiations
    'some-molecule-key': Molecule,
    'another-molecule-key': Molecule
  },
  pools: {
    global: {
      instances: {
        'some-global-atom-key': {
          _default: 'in-0',
          '{some:"param"}': 'in-1'
        },
        'some-local-atom-key': {}
      }
    },
    'app-0': {
      instances: {
        'some-app-atom-key': {
          _default: 'in-0'
        }
      },
      overrides: {
        'some-app-atom-key': 'ov-0'
      }
    }
  }
}
```

Fully qualified ids for referring to atom implementations, instances, and overrides are tuples like `['some-atom-key', 'ai-0']`

### factory hooks (injectors?)

```tsx
const todosAtom = atom('todos', [])

const filteredTodosAtom = atom({
  key: 'filteredTodos',
  value: (isDone: boolean) => {
    const todos = todosAtom.injectValue()

    return todos.filter(todo => todo.isDone === isDone)
  },
})

const Filter = () => {
  const finishedTodos = filteredTodosAtom.useValue(true)
  const unfinishedTodos = filteredTodosAtom.useValue(false)

  return (
    <>
      <h3>finished todos:</h3>
      <ul>
        {finishedTodos.map(todo => (
          <li>{todo.text}</li>
        ))}
      </ul>
      <h3>unfinished todos:</h3>
      <ul>{unfinishedTodos.map()}</ul>
    </>
  )
}
```

async example

```tsx
import axios from 'axios'

const axiosAtom = atom({
  key: 'axios',
  readonly: true,
  value: axios
})

const usersListAtom = atom('usersList', () => {
  const axios = axiosAtom.injectValue()
  const filters = filtersAtom.injectValue()
  const store = injectConstant(() => createStore().hydrate([]))

  injectEffect(() => {
    const { data } = await axios.post('http://localhost/users/fetch', {
      filters,
    })
    store.setState(data)
  }, [axios, filters])

  return store
})

// SomeComponent
const usersList = usersListAtom.useValue()


const electronNetwork = axiosAtom.override(() => ({
  post: (...args) => network.request(...args)
}))

// ElectronApp
<AppProvider atoms={[electronNetwork]}>
  <SomeComponent />
</AppProvider>
```

streams example

```tsx
const usersStreamAtom = atom({
  key: 'usersStream',
  readonly: true,
  value: () => {
    const openSocket = openSocketAtom.useValue()

    return from(openSocket('wss://localhost/users'))
  },
})

const usersReducer = createReducer([])
// ... handle add, delete, update ...

const usersListAtom = atom('usersList', () => {
  const [users$, setUsers$] = usersStreamAtom.injectState()
  const store = injectConstant(() => createStore(usersReducer))

  injectEffect(() => {
    const subscription = users$.subscribe(store.dispatch)

    return subscription.unsubscribe
  }, [users$])

  return store
})

// some component

const [users, setUsers] = usersListAtom.useState()
```

```tsx
const filteredTodosStreamAtom = atom({
  key: 'filteredTodosStream',
  readonly: true,
  value: () => {
    const todos$ = todosAtom.injectValue$()
    const filters$ = filtersAtom.injectValue$()

    // injectConstant isn't needed in this particular atom 'cause nothing could cause it to recompute
    // TODO: That's actually a feature we could add - some `static: true` atom config option to turn off reactivity
    // (actually probably log an error if a reactive injector is used in such an atom)
    return injectConstant(
      () => todos$.pipe(
        withLatestFrom(filters$),
        filter(([todo, filters]) => todo.isDone !== filters.isDone),
        map(([todo]) => todo)
      )
    )
  }
})

// ... in some component:

const todos$ = filteredTodosStreamAtom.useValue()
```

## Current API

- `atom.useAction$()` - probably replace with a `useAction$(atom)` helper from @zedux/streams
- `atom.useApi()` - I do not know what this was supposed to be. Everything? Isn't that what `useInstance()` is for?
- `atom.useCallback()` - now `useMethods()`
- `atom.useDispatch()`
- `atom.useInstance()`
- `atom.useInvalidate()`
- `atom.useMetadata()` - ? Maybe. Not doing for now
- `atom.useSelector()`
- `atom.useSetState()`
- `atom.useState()`
- `atom.useStore()`
- `atom.useValue()`
- `atom.useValue$()` - probably replace with a `useValue$(atom)` helper from @zedux/streams

- `atom.useLocal()` .... no. This is just `localAtom.useValue()` or `*State()` or `*Dispatch()` or `*Store()` or `*Methods()` or `*Instance()`. No, correction, only `atom.useInstance()` and `atom.injectInstance()` do this. The other hooks are now an alias for `atom.useConsumer(...args).use*()` and same for injectors (obv..).
- `atom.useConsumer()`

- `atom.injectAction$()` - probably replace with a `injectAction$(atom)` helper from @zedux/streams
- `atom.injectApi()`
- `atom.injectCallback()`
- `atom.injectDispatch()`
- `atom.injectInstance()`
- `atom.injectInvalidate()`
- `atom.injectMetadata()` - ? Maybe. Not doing for now
- `atom.injectSelector()`
- `atom.injectSetState()`
- `atom.injectState()`
- `atom.injectStore()`
- `atom.injectValue()`
- `atom.injectValue$()` - probably replace with a `injectValue$(atom)` helper from @zedux/streams

- `atom.injectLocal()` ??? No. This is just `localAtom.injectValue()` or `*State()` or `*Dispatch()` or `*Store()` or `*Methods()` or `*Instance()`. Actually nope, see above correction for `atom.useLocal()`.
- `atom.injectConsumer()` ?? Nope. Wellll it is possible. `atom.use*` would have to `useContext(universalInstancesContext)` and pass that tree of provided instances to the atom diContext layer. Um except no, 'cause a given atom instance could be created outside this React component tree but still inside the AppProvider. So this has to come back to the AppProvider layer. Which isn't useful for differentiating instances in the same AppProvider. So no.


- `selector.useValue()`
- `selector.useValue$()`
- `selector.useMetadata()`
- `selector.useApi()` ?

- `selector.injectValue()`
- `selector.injectValue$()`
- `selector.injectMetadata()`
- `selector.injectApi()` ?


- `molecule.useValue()`
- `molecule.useValue$()`

- `molecule.injectValue()`
- `molecule.injectValue$()`


- `atom()`
- `molecule()`
- `selector()`
- `<AppProvider />`
- `<AtomInstanceProvider />`


- `injectCallback()`
- `injectConstant()`
- `injectEffect()`
- `injectMemo()`
- `injectRef()`


- `useGlobalStore()`


### `atom.useInstance()` and `atom.injectInstance()`

This hook/injector can be used to grab other hooks without re-passing params or recreating a subscription to the atom for performance reasons. Can also be used to pass an atom instance down to children components via context so they don't have to know/specify params either:

```tsx
const RegistrationForm = ({ children }) => {
  const formAtomInstance = formAtom.useInstance('registration-form')
  const form = formAtomInstance.useValue()
  const dispatch = formAtomInstance.useDispatch()

  return (
    <formAtomInstance.Provider>
      {children}
    </formAtomInstance.Provider>
  )
}

const Input = ({ name }) => {
  const formAtomInstance = formAtom.useConsumer() // TODO: we could make some way to notify formAtom of this consumer, passing params to initialize this form field
  const [form, setForm] = formAtomInstance.useState()

  return (
    <input
      name={name}
      onChange={({ target }) => setForm({ [name]: target.value })}
      value={value}
    />
  )
}

const Parent = () => (
  <RegistrationForm>
    <Input name="email" />
    <Input name="password" />
  </RegistrationForm>
)
```

## MOaR StuFf

NOTE: local atoms could take non-serializable params (including atom instances)

NOTE: could add a suspense preload hook thing

```tsx
function SomeComponent() {
  const loadSomeAtom = someAtom.useLazy() // doesn't actually create an instance

  return (
    <button onClick={() => {
      loadSomeAtom(params) // creates the instance
    }}>
      Click to load!
    </button>
  )
}
```

NOTE: could add more suspense stuff

```tsx
const someAtom = atom('some', () => {
  injectSuspender(async () => {
    const val = await someAsyncOperation()
    return val
  })
})

// or
const someAtom = atom('some', () => {
  const [machine, promise] = injectAsync(async machine => {
    machine.start()

    try {
      const result = await fetchSomething()
      machine.success(await result.json())
    } catch (err) {
      machine.error(err)
    }
  }, [])

  injectSuspender(promise)

  return machine
})
```


## Main Features Zedux Has That Other Libs Don't

- action streams
- isolated stores work well with code splitting
- designed to work with streams - e.g. reusing a single socket connection or managing lifecycles of socket.io, kafka, or gRPC data streams.

And it adds:

- DI
- state machines

## React Query Similarities

```tsx
import { injectQuery, useAtom } from '@zedux/react'

function Todos() {
  const { data, error, isFetching, status } = useAtom('todos', () => injectQuery(fetchTodos))
}

// dependent queries
const { isIdle, data: projects } = useQuery('projects', async () => {
  const userId = await currentUserIdAtom.injectValueAsync()

  return getProjectsByUser(userId)
})
```

## AtomContext example

```tsx
const reduxAtomContext = atomContext(INITIAL_REDUX_STATE)

function App() {
  const reduxState = useSelector(state => state)
  const reduxContext = reduxAtomContext.useInstance(reduxState)

  return (
    <AppProvider contexts={[reduxContext]}>
      <Routes />
    </AppProvider>
  )
}

const someAtom = atom('some', () => {
  const reduxInstance = reduxAtomContext.injectConsumer() // there is no injectInstance()
  const reduxState = reduxAtomContext.injectValue()
})

function SomeComponent() {
  const reduxInstance = reduxAtomContext.useConsumer() // there is a useInstance() - need to clearly document the distinction
  const reduxState = reduxAtomContext.useValue()
}
```

## Work List

Round 1 (end of December, 2020)

x- Make use* and inject* apis similar
x- Determine if factories are ok the way they are or if they should mimic hooks - rerendering on dep change
  x- (After Way Too MUCH debate, it's been decided to switch to a hooks/react-like approach)
x- Add `readonly` atoms. Good for top-level wrapper atoms (e.g. an `axios` atom) and selector atoms
x- Add `preload: init => init(params)` and `<AppProvider preload={() => { someAtom.useState(params) }}>`
  x- also make `preload` return `{children}` so they can be wrapped in `<AtomInstanceProvider instances={[...instances]}>`
x- Add a param to `store.getRefCount()` to filter out internal Zedux subscriptions
x- Expand `testMode` to a `flags` param and `isTestSafe` to a `flags` prop.
- Finish examples
- Write tests
- Write documentation

Round 2 (Feb 17, 2021)

x- context (`<AppProvider context={...}>` and `injectContext()`)
  x- now ~`contextStore()` (?)~ `atomContext()`
- `molecule()` and add molecule instantiation to atom instantiation
- remove duplicated code in `selector()` and `atom()`
- clean up types (does each atom, atom instance, and atom config really need its own interface)
- `atom.useDispatch()` and `atom.injectDispatch()`
- `atom.useState()` and `atom.injectState()`
- `atom.useSetState()` and `atom.injectSetState()`
x- `instance.Provider` and `atom.useConsumer()`
x- `injectInvalidate()`, `atom.injectInvalidate()`, `atom.useInvalidate()`
- `useStore()`, `atom.useStore()`, `atom.injectStore()`
x- `injectCallback()`
- all the standard atom factories - `globalAtom()`, `globalSelector()`, `localAtom()`, `localSelector()`
- all the specialized atom factories - `molecule()`, `query()`, `stream()`, `mutation()`
- all the inline hook factories? - `useGlobalAtom()`, `useGlobalSelector()`, `useLocalAtom()`, `useLocalSelector()`
- React Query stuff
  - add `atom.invalidateAll()`? No, it would have to use a hook. Maybe `const invalidate = atom.useInvalidate(); invalidate.all()`
  - `query()`, `mutation()`, `stream()` OR `promise()`, `stream()` OR `unary()`, `clientStream()`, `serverStream()`, `multiplexStream()` OR injectors - `injectQuery()` &c. or `injectPromise()` &c. or `injectUnary()` &c.
- should `useInstance()` everywhere be changed to `useProvider()`?
- `atom.useSelector()` and `atom.injectSelector()`
- a way to dynamically instantiate and access atoms and atomContexts - not using hooks (directly). Like React Query's `useQueries()` hook - https://react-query.tanstack.com/guides/parallel-queries#dynamic-parallel-queries-with-usequeries. I'm thinking at least `useAtomContexts()` and `useAtoms()` (and equivalent injectors).
- make AppProviders composable. Overrides and contexts from multiple parent AppProviders are merged together. Global atoms get added to the lowest pool that overrides them.
x- `injectWhy()`
- `methods` -> `exports`
- `maxInstances` - complements ttl. Use a FIFO queue. No instances will ever be cleaned up while in use. And none will be cleaned up while queueSize <= maxInstances. Stale instances will be scheduled for clean up when queueSize > maxInstances. Newly stale instances will be immediately scheduled for clean up if queueSize > maxInstances.
- should `useSelector()`/`injectSelector()` be changed to `useDerivation()`/`injectDerivation()`? The term "selector" is too overloaded.