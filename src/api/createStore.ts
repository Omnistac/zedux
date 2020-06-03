import { hierarchyDescriptorToDiffTree } from '@src/hierarchy/create'
import { mergeDiffTrees, mergeStateTrees } from '@src/hierarchy/merge'
import { delegate, propagateChange } from '@src/hierarchy/traverse'
import {
  Action,
  ActionChain,
  Dispatchable,
  EffectChain,
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
} from '@src/types'
import {
  assert,
  assertIsPlainObject,
  assertIsValidAction,
  assertIsValidNodeOption,
  getError,
  invalidAccess,
} from '@src/utils/errors'
import { STORE_IDENTIFIER, observableSymbol } from '@src/utils/general'
import * as defaultHierarchyConfig from '@src/utils/hierarchyConfig'
import { DiffNode } from '@src/utils/types'
import { actionTypes, effectTypes, metaTypes } from './constants'
import { addMeta, hasMeta, removeAllMeta } from './meta'

/**
  Creates a new Zedux store.

  A store is just a collection of functions and a special $$typeof
  symbol that identifies it internally.

  Zedux stores are fast, composable, and pretty much just awesome.
*/
export const createStore = <State = any>(
  initialHierarchy?: HierarchyDescriptor<State>
): Store<State> => {
  let hierarchyConfig = defaultHierarchyConfig as HierarchyConfig
  let currentDiffTree: DiffNode
  let currentState: State
  let isDispatching = false
  let rootReducer: Reducer<State>
  const subscribers: SubscriberObject<State>[] = []

  /**
    Sets one or more hierarchy config options that will be used by the
    store's intermediate reducers in the generated reducer hierarchy to
    interact with the hierarchical data type returned by the store's
    reducers. There _is_ sense in that sentence.

    This "hierarchical data type" is a plain object by default. But these
    hierarchy config options can teach Zedux how to use an Immutable `Map`
    or any recursive map-like data structure.
  */
  const configureHierarchy = (options: HierarchyConfig) => {
    assertIsPlainObject(options, 'Hierarchy config object')

    // Clone the existing config
    hierarchyConfig = { ...hierarchyConfig }

    Object.entries(options).forEach(
      ([key, val]: [keyof HierarchyConfig, any]) => {
        assertIsValidNodeOption(hierarchyConfig, key, val)

        hierarchyConfig[key] = val
      }
    )

    return store // for chaining
  }

  /**
    Dispatches an action to the store.

    The action will be sent through this store's reducer hierarchy (if any)
    and passed on to any child stores after being wrapped in INHERIT meta nodes

    The resulting state will be returned synchronously from this call.
  */
  const dispatch = (action: Dispatchable) => {
    if (typeof action === 'function') {
      throw new TypeError(`
        Zedux Error - store.dispatch() - Thunks are not currently supported.
        Only normal action objects can be passed to store.dispatch().
        Inducers should be passed to store.setState()`)
    }

    assertIsPlainObject(action, 'Action')

    const delegateResult = delegate(currentDiffTree, action)

    if (delegateResult) {
      // No need to inform subscribers - this store's effects subscriber
      // on the child store will have already done that by this point
      return {
        error: delegateResult.error,
        state: currentState,
      }
    }

    return routeAction(action)
  }

  /**
    Returns the current state of the store.

    Do not mutate this value.
  */
  const getState = () => {
    if (isDispatching) {
      throw new Error(invalidAccess('store.getState()'))
    }

    return currentState
  }

  /**
    "Hydrates" the store with the given state.

    Dispatches the special HYDRATE action to the store's inspectors
    and reducers. The HYDRATE action's `payload` property will be
    set to the new store state, allowing inspectors to pick up on
    the changes and implement time travel and whatnot.

    Throws an Error if called from the reducer layer.
  */
  const hydrate = (newState?: State) => {
    dispatchHydration(newState)

    return store // for chaining
  }

  /**
    Applies a partial state update to the store.

    Accepts either a deep partial state object or a function (inducer)
    that returns one.

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
  const setState = (settable: Settable) => {
    if (typeof settable === 'function') {
      return dispatchInducer(settable)
    }

    return dispatchPartialHydration(settable)
  }

  /**
    Registers a subscriber with the store.

    The subscriber will be notified every time the store's state
    changes.

    Returns a subscription object. Calling `subscription.unsubscribe()`
    unregisters the subscriber.
  */
  const subscribe = (subscriber: Subscriber<State>) => {
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

    subscribers.push(subscriberObj)

    return {
      unsubscribe() {
        const index = subscribers.indexOf(subscriberObj)

        if (index === -1) return

        subscribers.splice(index, 1)
      },
    }
  }

  /**
    Merges a hierarchy descriptor into the existing hierarchy descriptor.

    Intelligently diffs the two hierarchies and only creates/recreates the
    necessary reducers.

    Dispatches the special RECALCULATE action to the store.
  */
  const use = (newHierarchy?: HierarchyDescriptor) => {
    const newDiffTree = hierarchyDescriptorToDiffTree(
      newHierarchy,
      registerChildStore
    )

    currentDiffTree = mergeDiffTrees(
      currentDiffTree,
      newDiffTree,
      hierarchyConfig
    )
    rootReducer = currentDiffTree.reducer

    if (rootReducer) dispatch({ type: actionTypes.RECALCULATE })

    return store // for chaining
  }

  const dispatchAction = (
    action: ActionChain,
    unwrappedAction: Action,
    rootState = currentState
  ) => {
    if (isDispatching) {
      throw new Error(invalidAccess('dispatch(), hydrate(), setState()'))
    }

    isDispatching = true

    const effects = [getDispatchEffect(action)]
    let error = null
    let newState = rootState

    try {
      newState = dispatchToReducer(unwrappedAction, rootState)
    } catch (err) {
      error = err
    }

    isDispatching = false

    informSubscribers(action, error, newState, effects)

    return {
      error,
      state: newState,
    }
  }

  const dispatchHydration = (
    newState: State,
    actionType = actionTypes.HYDRATE
  ) => {
    if (newState === currentState) {
      // Nothing to do. Should this inform effects subscribers?
      return {
        state: currentState,
      }
    }

    const action = {
      type: actionType,
      payload: newState,
    }

    // Maybe we can provide a utility for setting a description for the
    // hydration. Then wrap the action in an ActionMeta with that description
    // as the metaData.

    // Propagate the change to child stores and allow for effects.
    return dispatchAction(action, action, newState)
  }

  const dispatchInducer = (inducer: Inducer<State>) => {
    let partialStateTree

    try {
      partialStateTree = inducer(currentState)
    } catch (error) {
      informSubscribers(
        { type: actionTypes.PARTIAL_HYDRATE },
        error,
        currentState,
        []
      )

      return { error, state: currentState }
    }

    return dispatchPartialHydration(partialStateTree)
  }

  const dispatchPartialHydration = (
    partialStateTree: RecursivePartial<State>
  ) => {
    const [newState] = mergeStateTrees(
      currentState,
      partialStateTree,
      hierarchyConfig
    )

    return dispatchHydration(newState, actionTypes.PARTIAL_HYDRATE)
  }

  const getDispatchEffect = (action: ActionChain) => {
    return {
      effectType: effectTypes.DISPATCH,
      payload: action,
    }
  }

  const dispatchToReducer = (action: Action, rootState: State) => {
    return rootReducer ? rootReducer(rootState, action) : rootState
  }

  const informSubscribers = (
    action: ActionChain,
    error: Error,
    newState: State,
    effects: EffectChain[]
  ) => {
    const oldState = currentState

    // There is a case here where a reducer in this store could
    // dispatch an action to a parent or child store. Investigate
    // ways to handle this.

    // Update the stored state
    currentState = newState

    // Clone the subscribers in case of mutation mid-iteration
    ;[...subscribers].forEach(subscriber => {
      if (error && subscriber.error) subscriber.error(error)

      if (newState !== oldState && subscriber.next) {
        subscriber.next(newState, oldState)
      }

      if (!subscriber.effects) return

      subscriber.effects({ action, effects, error, newState, oldState, store })
    })
  }

  const registerChildStore = (childStorePath: string[], childStore: Store) => {
    const effectsSubscriber: EffectsSubscriber<State> = ({
      action,
      effects,
      error,
      newState,
      oldState,
    }) => {
      // If this store's reducer layer dispatched this action to this
      // substore in the first place, ignore the propagation; this store
      // will receive it anyway.
      if (isDispatching) return

      const newOwnState =
        newState === oldState
          ? currentState
          : propagateChange(
              currentState,
              childStorePath,
              newState,
              hierarchyConfig
            )

      const isInherited = hasMeta(action, metaTypes.INHERIT)
      const wrappedEffects = effects

        // If this store delegated this action in the first place,
        // ignore the propagated DISPATCH effect
        .filter(
          effect =>
            !isInherited ||
            removeAllMeta(effect).effectType !== effectTypes.DISPATCH
        )

        // Tell the subscribers what child store this effect came from.
        // This store (the parent) can use this info to determine how to
        // recreate this state update.
        .map(effect => addMeta(effect, metaTypes.DELEGATE, childStorePath))

      informSubscribers(action, error, newOwnState, wrappedEffects)
    }

    return childStore.subscribe({ effects: effectsSubscriber }).unsubscribe
  }

  const routeAction = (action: ActionChain) => {
    const unwrappedAction = removeAllMeta(action)

    assertIsValidAction(unwrappedAction)

    if (unwrappedAction.type === actionTypes.HYDRATE) {
      return dispatchHydration(unwrappedAction.payload)
    }

    if (unwrappedAction.type === actionTypes.PARTIAL_HYDRATE) {
      return setState(unwrappedAction.payload)
    }

    return dispatchAction(action, unwrappedAction)
  }

  const store = ({
    dispatch,
    getState,
    hydrate,
    configureHierarchy,
    setState,
    subscribe,
    use,
    [observableSymbol]: () => store,
    $$typeof: STORE_IDENTIFIER,
  } as unknown) as Store<State>

  if (initialHierarchy) store.use(initialHierarchy)

  return store
}
