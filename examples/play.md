```ts
import { createActor, createReducer, createStore, withEffects } from 'zedux'

const addTodo = createActor('addTodo')
const reducer = createReducer([])
  .reduce(addTodo, (state, todo) => [...state, todo])

const todosStore = createStore(reducer)

const withEffects = createEffectsStore(todosStore)
  .handle(addTodo, async ({ action, store }) => {
    const data = await saveTodo(action.payload)
    store.dispatch(addTodoDone(data.id))
  })

const withStreams = createObservableStore(todosStore)
  .pipe((action$, state$) => action$.pipe(
    filter(action => action.type === addTodo.type),
    mergeMap(action => saveTodo(action.payload))
    map(data => addTodoDone(data.id))
  ))
  .pipe(action$ => action$.pipe())

const withIterators = createIteratorStore(todosStore)
  .watch(function*() {})



// observables round 2
const pipe1 = createStream((action$, state$) => action$.pipe())

// effects round 2
const store = withEffects({
  [addTodo.type]: async ({ action, store }) => {
    const data = await saveTodo(action.payload)
    store.dispatch(addTodoDone(data.id))
  }
})

// effects round 3
const actionHandler = handleAction<RootState>(
  addTodo,
  async ({ action, store }) => {
    const data = await saveTodo(action.payload)
    store.dispatch(addTodoDone(data.id))
  }
)

const stateHandler = handleState<RootState>(
  state => state.foo.bar, // any selector can go here
  async ({ newState, store }) => {
    await saveFooBar(newState.foo.bar)
  }
)

const store = withEffects(actionHandler, stateHandler)(todosStore)

// effects round 4
const handler = createEffectHandler<RootState>(
  ['someAction', anActor, state => state.foo.bar],
  async ({ newState, store }) => {
    await saveStuff(newState.foo.bar)
    store.dispatch(saveComplete())
  }
)

const store = withEffectHandlers(handler)(todosStore)

// or actually
const effectsStore = withEffectHandlers(handler)

effectsStore.use(todosStore)

// effects round 5
const effectsSubscriber = createEffectSubscriber<RootState>()
  .handle(addTodo, ({ action, store }) => {

  })
  .handle('addTodo', () => {})
  .handle(state => state.foo.bar, () => {})
  .handle([addTodo, state => state.todos], () => {})

todosStore.subscribe(effectsSubscriber)

// effects round 6

import { when } from 'zedux'

const whenRootStore = when(rootStore)

whenRootStore.machine(state => state.status.readyState)
  .enters(ReadyState.ready, ({ action }) => {})
  .leaves(ReadyState.initializing, () => {})

whenRootStore.stateMatches(
  state => state.todos.length > 5, ({ store }) => store.dispatch(something())
)

whenRootStore.receivesAction(timeout, () => alert('timed out!'))

whenRootStore.receivesAction(({ action, newState, oldState }) => {
  console.log('action dispatched', { action, newState, oldState })
})

// special signature (`effect` param here) for some of these?
whenRootStore.receivesEffect(subscriberRemoved, ({ effect }) => {})

whenRootStore.stateChanges(optionalSelector, effectCallback)

whenRootStore.isDestroyed(effectCallback)
```

## State Machines

```ts
// xstate:
import { Machine } from 'xstate'

const promiseMachine = Machine({
  id: 'promise',
  initial: 'pending',
  states: {
    pending: {
      on: {
        RESOLVE: 'resolved',
        REJECT: 'rejected',
      },
    },
    resolved: {
      type: 'final',
    },
    rejected: {
      type: 'final',
    },
  },
})

// zedux:
import { createState, createReducerMachine } from 'zedux'

const pending = createState('pending')
const resolved = createState('resolved').isFinal()
const rejected = createState('rejected').isFinal()

pending.on('RESOLVE', resolved).on('REJECT', rejected)

pending('RESOLVE') // 'resolved'

const promiseMachine = createReducerMachine(pending, [
  pending,
  resolved,
  rejected,
])

// traffic light
import { createState } from 'zedux'

const red = createState('red')
const green = createState('green')
const yellow = createState('yellow')

const walk = createState('walk')
const wait = createState('wait')
const stop = createState('stop')

red.addChildren([walk, wait, stop])

const machine = createReducerMachine(red)

// or
const promiseMachine = createMachine(pending).transition(pending, {
  [resolve]: resolved,
  [reject]: rejected,
})
```
