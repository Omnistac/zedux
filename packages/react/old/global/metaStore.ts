import {
  createActorFactory,
  createMachine,
  createReducer,
  createStore,
  Store,
} from '@zedux/core'
import {
  ActiveState,
  AtomMetadata,
  AtomValueResolved,
  ReadyState,
} from '../types'

// atoms use 2 state machines
const createActor = createActorFactory('@@react-zedux', 'atom-meta')
export const atomInitFailure = createActor<Error>('atomInitFailure')
export const atomInitSkip = createActor<AtomValueResolved>('atomInitSkip')
export const atomInitSuccess = createActor<{
  dependencies: [string, string][]
  stateStore: Store
}>('atomInitSuccess')
export const destroy = createActor('destroy')
export const destroyTimeout = createActor('destroytimeout')
export const wait = createActor('wait')
export const scheduleDestroy = createActor<ReturnType<typeof setTimeout>>(
  'scheduleDestroy'
)
export const subscriberAdded = createActor('subscriberAdded')
export const subscriberRemoved = createActor('subscriberRemoved')

const activeState = createMachine<ActiveState>(ActiveState.active)
  .addTransition(ActiveState.active, scheduleDestroy, ActiveState.destroying)
  .addTransition(ActiveState.active, destroy, ActiveState.destroyed)
  .addTransition(ActiveState.destroying, subscriberAdded, ActiveState.active)
  .addTransition(ActiveState.destroying, destroyTimeout, ActiveState.destroyed)

const readyState = createMachine<ReadyState>(ReadyState.initializing)
  .addTransition(ReadyState.initializing, wait, ReadyState.waiting)
  .addTransition(ReadyState.initializing, atomInitSkip, ReadyState.ready)
  .addTransition(ReadyState.waiting, atomInitSuccess, ReadyState.ready)
  .addTransition(ReadyState.waiting, atomInitFailure, ReadyState.error)

const destructionTimeout = createReducer<
  ReturnType<typeof setTimeout>
>().reduce(scheduleDestroy, (_, timeoutId) => timeoutId)

const subscriberCount = createReducer(0)
  .reduce(subscriberAdded, state => state + 1)
  .reduce(subscriberRemoved, state => state - 1)

export const createMetaStore = <T>(): Store<AtomMetadata<T>> =>
  createStore<AtomMetadata<T>>({
    activeState,
    destructionTimeout,
    readyState,
    subscriberCount,
  })
