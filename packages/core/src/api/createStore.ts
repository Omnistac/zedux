import { hierarchyDescriptorToDiffTree } from '../hierarchy/create'
import { mergeDiffTrees, mergeStateTrees } from '../hierarchy/merge'
import { delegate, propagateChange } from '../hierarchy/traverse'
import {
  Action,
  ActionChain,
  Dispatchable,
  EffectChain,
  EffectData,
  EffectsSubscriber,
  HierarchyConfig,
  HierarchyDescriptor,
  Inducer,
  RecursivePartial,
  Reducer,
  Settable,
  Store,
  Subscriber,
  SubscriberObject,
} from '../types'
import {
  assert,
  assertIsPlainObject,
  assertIsValidAction,
  assertIsValidNodeOption,
  getError,
  invalidAccess,
} from '../utils/errors'
import {
  INTERNAL_SUBSCRIBER_ID,
  observableSymbol,
  STORE_IDENTIFIER,
} from '../utils/general'
import * as defaultHierarchyConfig from '../utils/hierarchyConfig'
import { DiffNode, RegisterSubStore } from '../utils/types'
import { actionTypes, effectTypes, metaTypes } from './constants'
import { addMeta, removeAllMeta } from './meta'

interface StoreInternals<State = any> {
  currentDiffTree?: DiffNode
  currentState: State
  hierarchyConfig: HierarchyConfig
  isDispatching?: boolean
  registerChildStore: RegisterSubStore
  rootReducer?: Reducer<State>
  store: Store<State>
  // map subscriber to true if it's an internal subscriber
  subscribers: Map<SubscriberObject<State>, boolean>
}

const RECALCULATE_ACTION = { type: actionTypes.RECALCULATE }
const SUBSCRIBED_EFFECT = { effectType: effectTypes.SUBSCRIBER_ADDED }
const UNSUBSCRIBED_EFFECT = { effectType: effectTypes.SUBSCRIBER_REMOVED }

const dispatchAction = (
  action: ActionChain,
  unwrappedAction: Action,
  storeInternals: StoreInternals,
  rootState = storeInternals.currentState
) => {
  if (storeInternals.isDispatching) {
    throw new Error(invalidAccess('dispatch(), hydrate(), setState()'))
  }

  storeInternals.isDispatching = true

  let error: Error | undefined
  let newState = rootState

  try {
    if (storeInternals.rootReducer) {
      newState = storeInternals.rootReducer(rootState, unwrappedAction)
    }
  } catch (err) {
    error = err

    throw err
  } finally {
    storeInternals.isDispatching = false

    informSubscribers(newState, storeInternals, action, undefined, error)
  }

  return newState
}

/**
  "Hydrates" the store with the given state.

  Dispatches the special HYDRATE action to the store's inspectors
  and reducers. The HYDRATE action's `payload` property will be
  set to the new store state, allowing inspectors to pick up on
  the changes and implement time travel and whatnot.

  Throws an Error if called from the reducer layer.
*/
const dispatchHydration = <State = any>(
  newState: State,
  storeInternals: StoreInternals<State>,
  actionType = actionTypes.HYDRATE
) => {
  if (newState === storeInternals.currentState) {
    // Nothing to do. Should this inform effects subscribers?
    return storeInternals.currentState
  }

  const action = {
    type: actionType,
    payload: newState,
  }

  // Maybe we can provide a utility for setting a description for the
  // hydration. Then wrap the action in an ActionMeta with that description
  // as the metaData.

  // Propagate the change to child stores and allow for effects.
  return dispatchAction(action, action, storeInternals, newState)
}

const dispatchInducer = <State = any>(
  inducer: Inducer<State>,
  storeInternals: StoreInternals<State>
) => {
  let partialStateTree

  try {
    partialStateTree = inducer(storeInternals.currentState)
  } catch (error) {
    informSubscribers(
      storeInternals.currentState,
      storeInternals,
      { type: actionTypes.PARTIAL_HYDRATE },
      undefined,
      error
    )

    throw error
  }

  return dispatchPartialHydration(partialStateTree, storeInternals)
}

const dispatchPartialHydration = <State = any>(
  partialStateTree: Partial<State> | RecursivePartial<State>,
  storeInternals: StoreInternals<State>
) => {
  const [newState] = mergeStateTrees(
    storeInternals.currentState,
    partialStateTree,
    storeInternals.hierarchyConfig
  )

  return dispatchHydration(
    newState,
    storeInternals,
    actionTypes.PARTIAL_HYDRATE
  )
}

/**
  Sets one or more hierarchy config options that will be used by the
  store's intermediate reducers in the generated reducer hierarchy to
  interact with the hierarchical data type returned by the store's
  reducers. There _is_ sense in that sentence.

  This "hierarchical data type" is a plain object by default. But these
  hierarchy config options can teach Zedux how to use an Immutable `Map`
  or any recursive, map-like data structure.
*/
const doConfigureHierarchy = (
  next: Partial<HierarchyConfig>,
  storeInternals: StoreInternals
) => {
  assertIsPlainObject(next, 'Hierarchy config object')

  // Clone the existing config
  const prev = storeInternals.hierarchyConfig
  const clonedPrev = { ...prev }

  Object.entries(next).forEach(([key, val]) => {
    assertIsValidNodeOption(prev, key, val)
    ;(clonedPrev as any)[key] = val
  })

  return clonedPrev
}

/**
  Dispatches an action to the store.

  The action will be sent through this store's reducer hierarchy (if any)
  and passed on to any child stores after being wrapped in INHERIT meta nodes

  The resulting state will be returned synchronously from this call.
*/
const doDispatch = (action: ActionChain, storeInternals: StoreInternals) => {
  if (typeof action === 'function') {
    throw new TypeError(`
      Zedux Error - store.dispatch() - Thunks are not currently supported.
      Only normal action objects can be passed to store.dispatch().
      Inducers should be passed to store.setState()`)
  }

  assertIsPlainObject(action, 'Action')

  const delegateResult = delegate(storeInternals.currentDiffTree, action)

  if (delegateResult !== false) {
    // No need to inform subscribers - this store's effects subscriber
    // on the child store will have already done that by this point
    return storeInternals.currentState
  }

  return routeAction(action, storeInternals)
}

const doRegisterChildStore = <State = any>(
  childStorePath: string[],
  childStore: Store,
  storeInternals: StoreInternals<State>
) => {
  const effectsSubscriber: EffectsSubscriber<State> = ({
    action,
    effect,
    error,
    newState,
    oldState,
  }) => {
    // If this store's reducer layer dispatched this action to this
    // substore in the first place, ignore the propagation; this store
    // will receive it anyway.
    // const isInherited = hasMeta(action, metaTypes.INHERIT)
    if (storeInternals.isDispatching) return

    const newOwnState =
      newState === oldState
        ? storeInternals.currentState
        : propagateChange(
            storeInternals.currentState,
            childStorePath,
            newState,
            storeInternals.hierarchyConfig
          )

    // Tell the subscribers what child store this effect came from.
    const wrappedEffect =
      effect && addMeta(effect, metaTypes.DELEGATE, childStorePath)

    // Tell the subscribers what child store this action came from.
    // This store (the parent) can use this info to determine how to
    // recreate this state update.
    const wrappedAction =
      action && addMeta(action, metaTypes.DELEGATE, childStorePath)

    informSubscribers(
      newOwnState,
      storeInternals,
      wrappedAction,
      wrappedEffect,
      error
    )
  }

  return childStore.subscribe({
    effects: effectsSubscriber,
    id: INTERNAL_SUBSCRIBER_ID,
  } as any).unsubscribe
}

/**
  Applies a partial state update to the store.

  Accepts either a deep partial state object or a function that returns one.

  Dispatches the special PARTIAL_HYDRATE action to the store's inspectors
  and reducers. The PARTIAL_HYDRATE action's `payload` property will be
  set to the partial state update, allowing inspectors to pick up on
  the changes and implement time travel and whatnot.

  Works similar to React's `setState()` but deeply merges nested nodes.

  Note that this method cannot remove properties from the
  state tree. If that functionality is needed, use store.hydrate()
  or create a reducer hierarchy and .use() it.

  Throws an error if called from the reducer layer.
*/
const doSetState = <State = any>(
  settable: Settable<State>,
  storeInternals: StoreInternals<State>
) => {
  if (typeof settable === 'function') {
    return dispatchInducer(settable as Inducer<State>, storeInternals)
  }

  return dispatchPartialHydration(settable, storeInternals)
}

/**
  Registers a subscriber with the store.

  The subscriber will be notified every time the store's state
  changes.

  Returns a subscription object. Calling `subscription.unsubscribe()`
  unregisters the subscriber.
*/
const doSubscribe = <State = any>(
  subscriber: Subscriber<State>,
  storeInternals: StoreInternals<State>
) => {
  const subscriberObj =
    typeof subscriber === 'function' ? { next: subscriber } : subscriber

  if (subscriberObj.next) {
    assert(
      typeof subscriberObj.next === 'function',
      getError('subscriberNext'),
      subscriberObj.next
    )
  }

  if (subscriberObj.error) {
    assert(
      typeof subscriberObj.error === 'function',
      getError('subscriberError'),
      subscriberObj.error
    )
  }

  if (subscriberObj.effects) {
    assert(
      typeof subscriberObj.effects === 'function',
      getError('subscriberEffects'),
      subscriberObj.effects
    )
  }

  // as any - this "id" field is hidden from the outside world
  // so it doesn't exist on the Subscriber type
  storeInternals.subscribers.set(
    subscriberObj,
    (subscriberObj as any).id === INTERNAL_SUBSCRIBER_ID
  )

  informSubscribers(
    storeInternals.currentState,
    storeInternals,
    undefined,
    SUBSCRIBED_EFFECT
  )

  return {
    unsubscribe() {
      storeInternals.subscribers.delete(subscriberObj)
      informSubscribers(
        storeInternals.currentState,
        storeInternals,
        undefined,
        UNSUBSCRIBED_EFFECT
      )
    },
  }
}

/**
  Merges a hierarchy descriptor into the existing hierarchy descriptor.

  Intelligently diffs the two hierarchies and only creates/recreates the
  necessary reducers.

  Dispatches the special RECALCULATE action to the store.
*/
const doUse = <State = any>(
  newHierarchy: HierarchyDescriptor<State>,
  storeInternals: StoreInternals<State>
) => {
  const newDiffTree = hierarchyDescriptorToDiffTree(
    newHierarchy,
    storeInternals.registerChildStore
  )

  storeInternals.currentDiffTree = mergeDiffTrees(
    storeInternals.currentDiffTree,
    newDiffTree,
    storeInternals.hierarchyConfig
  )
  storeInternals.rootReducer = storeInternals.currentDiffTree.reducer

  if (storeInternals.rootReducer) {
    dispatchAction(RECALCULATE_ACTION, RECALCULATE_ACTION, storeInternals)
  }
}

const getAction$ = <State = any>(storeInternals: StoreInternals<State>) => ({
  subscribe: (subscriber: { next: (action: ActionChain) => any }) =>
    doSubscribe(
      {
        effects: ({ action }) => {
          if (action) subscriber.next(action)
        },
      },
      storeInternals
    ),
})

const informSubscribers = <State = any>(
  newState: State,
  storeInternals: StoreInternals<State>,
  action?: ActionChain,
  effect?: EffectChain,
  error?: Error
) => {
  const oldState = storeInternals.currentState

  // There is a case here where a reducer in this store could
  // dispatch an action to a parent or child store. Investigate
  // ways to handle this.

  // Update the stored state
  storeInternals.currentState = newState

  let infoObj: EffectData<State> | undefined

  // Clone the subscribers in case of mutation mid-iteration
  const subscribers = [...storeInternals.subscribers.keys()]

  for (const subscriber of subscribers) {
    if (error && subscriber.error) subscriber.error(error)

    if (newState !== oldState && subscriber.next) {
      subscriber.next(newState, oldState)
    }

    if (!subscriber.effects) continue

    if (!infoObj) {
      infoObj = {
        action,
        effect,
        error,
        newState,
        oldState,
        store: storeInternals.store,
      }
    }

    subscriber.effects(infoObj)
  }
}

const routeAction = (action: ActionChain, storeInternals: StoreInternals) => {
  const unwrappedAction = removeAllMeta(action)

  assertIsValidAction(unwrappedAction)

  if (unwrappedAction.type === actionTypes.HYDRATE) {
    return dispatchHydration(unwrappedAction.payload, storeInternals)
  }

  if (unwrappedAction.type === actionTypes.PARTIAL_HYDRATE) {
    return doSetState(unwrappedAction.payload, storeInternals)
  }

  return dispatchAction(action, unwrappedAction, storeInternals)
}

/**
  Creates a new Zedux store.

  A store is just a few functions and a special $$typeof symbol that identifies
  it internally.
*/
export const createStore: {
  <State = any>(
    initialHierarchy?: HierarchyDescriptor<State>,
    initialState?: State
  ): Store<State>
  <State = any>(initialHierarchy: null, initialState: State): Store<State>
} = <State = any>(
  initialHierarchy?: HierarchyDescriptor<State>,
  initialState?: State
) => {
  const configureHierarchy = (newConfig: HierarchyConfig) => {
    doConfigureHierarchy(newConfig, internals)

    return internals.store // for chaining
  }

  const dispatch = (action: Dispatchable) => doDispatch(action, internals)

  /**
    Returns the number of subscribers to this store.

    Pass true to include subscribers registered by Zedux
    (e.g. from parent stores)
  */
  const getRefCount = (includeInternalSubscribers?: boolean) =>
    includeInternalSubscribers
      ? internals.subscribers.size
      : [...internals.subscribers.values()].filter(isInternal => !isInternal)
          .length

  /**
    Returns the current state of the store.

    Do not mutate this value.
  */
  const getState = () => {
    if (internals.isDispatching) {
      throw new Error(invalidAccess('store.getState()'))
    }

    return internals.currentState
  }

  const hydrate = (newState: State) => {
    dispatchHydration(newState, internals)

    return internals.store // for chaining
  }

  const setState = (settable: Settable<State>) =>
    doSetState(settable, internals)

  const subscribe = (subscriber: Subscriber<State>) =>
    doSubscribe(subscriber, internals)

  const use = (newHierarchy: HierarchyDescriptor<State>) => {
    doUse(newHierarchy, internals)

    return internals.store // for chaining
  }

  const registerChildStore = (childStorePath: string[], childStore: Store) =>
    doRegisterChildStore(childStorePath, childStore, internals)

  const internals: StoreInternals<State> = {
    currentState: undefined as any,
    hierarchyConfig: defaultHierarchyConfig as HierarchyConfig,
    registerChildStore,
    subscribers: new Map(),
    store: {
      action$: {
        [observableSymbol]: () => getAction$(internals),
      } as any,
      dispatch,
      getRefCount,
      getState,
      hydrate,
      configureHierarchy,
      setState,
      subscribe,
      use,
      [observableSymbol]: () => internals.store,
      $$typeof: STORE_IDENTIFIER,
    } as any,
  }

  if (typeof initialState !== 'undefined') internals.currentState = initialState
  if (initialHierarchy) internals.store.use(initialHierarchy)

  return internals.store
}
