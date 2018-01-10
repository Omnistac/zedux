import {
  actionTypes, metaTypes
} from './constants'

import {
  assertAreFunctions, assertIsValidAction, assertIsValidNodeOption,
  assertIsPlainObject, invalidAccess
} from '../utils/errors'

import { STORE_IDENTIFIER } from '../utils/general'

import {
  delegate, hierarchyNodeToReactor, mergeHierarchyDescriptorNodes,
  mergeStateTrees, propagateChange
} from '../utils/hierarchy'

import {
  addMeta, hasMeta, removeAllMeta
} from '../utils/meta'

import {
  clone, create, get, isNode, iterate, set
} from '../utils/nodeOptions'


/**
  Creates a new Zedux store.

  A store is just a collection of functions and a special $$typeof
  symbol that identifies it internally.
*/
export function createStore() {
  let nodeOptions = {
    clone, create, get, isNode, iterate, set
  }
  let currentHierarchy = null
  let currentState
  let inspectors = []
  let isDispatchingToReducers = false
  let nextInspectors = []
  let nextSubscribers = []
  let rootReactor
  let subscribers = []


  /**
    Dispatches an action or inducer to the store.

    This is the only way to update the store's state.
  */
  const dispatch = action => {
    if (typeof action === 'function') {
      return dispatchInducer(action)
    }

    assertIsPlainObject(action, 'Action')

    if (delegate(currentHierarchy, action)) {
      return currentState
    }

    const unwrappedAction = removeAllMeta(action)

    assertIsValidAction(unwrappedAction)

    if (unwrappedAction.type === actionTypes.HYDRATE) {
      hydrate(unwrappedAction.payload)

      return currentState
    }

    dispatchToInspectors(action)

    if (!hasMeta(action, metaTypes.SKIP_REDUCERS)) {
      dispatchToReducers(unwrappedAction)
    }

    if (!hasMeta(action, metaTypes.SKIP_PROCESSORS)) {
      dispatchToProcessors(unwrappedAction)
    }

    return currentState
  }


  /**
    Returns the current state of the store.

    Do not mutate this value.
  */
  const getState = () => {
    if (isDispatchingToReducers) {
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
  const hydrate = newState => {
    if (isDispatchingToReducers) {
      throw new Error(invalidAccess('store.hydrate()'))
    }

    dispatchHydration(newState)

    return store // for chaining
  }


  /**
    Registers an inspector with the store.

    The inspector will be notified of all actions dispatched to the store,
    as well as pseudo-actions dispatched internally.
  */
  const inspect = inspector => {
    assertAreFunctions([ inspector ], 'store.inspect()')

    nextInspectors = [ ...nextInspectors, inspector ]

    return store // for chaining
  }


  /**
    Sets one or more node options that will be used by the store's
    intermediate reactors in the generated reactor hierarchy to
    interact with the hierarchical data type returned by the store's
    reducers.

    This "hierarchical data type" is a plain object by default. But
    these node options can teach Zedux how to use an Immutable "Map"
    or any recursive data structure.
  */
  const setNodeOptions = options => {
    assertIsPlainObject(options, 'Node options hash')

    Object.entries(options).forEach(([ key, val ]) => {
      assertIsValidNodeOption(nodeOptions, key, val)

      nodeOptions[key] = val
    })

    return store // for chaining
  }


  /**
    Applies a partial state update to the store.

    Dispatches the special PARTIAL_HYDRATE action to the store's inspectors
    and reducers. The PARTIAL_HYDRATE action's `payload` property will be
    set to the partial state update, allowing inspectors to pick up on
    the changes and implement time travel and whatnot.

    Works similar to React's `setState()` but deeply merges nested nodes.

    Note that this method cannot remove properties from the
    state tree. If that functionality is needed, use store.hydrate()
    or create a reactor hierarchy.

    Throws an error if called from the reducer layer.
  */
  const setState = partialStateTree => {
    if (isDispatchingToReducers) {
      throw new Error(invalidAccess('store.setState()'))
    }

    const newState = mergeStateTrees(
      currentState,
      partialStateTree,
      nodeOptions
    )

    dispatchHydration(newState, actionTypes.PARTIAL_HYDRATE)

    return currentState
  }


  /**
    Registers a subscriber with the store.

    The subscriber will be notified every time the store's state
    changes.

    Returns a subscription object. Calling `subscription.unsubscribe()`
    unregisters the subscriber.
  */
  const subscribe = subscriber => {
    assertAreFunctions([ subscriber ], 'store.subscribe()')

    nextSubscribers = [ ...nextSubscribers, subscriber ]

    const unsubscribe = () => {
      const index = nextSubscribers.indexOf(subscriber)

      if (index === -1) return

      nextSubscribers = [
        ...nextSubscribers.slice(0, index),
        ...nextSubscribers.slice(index + 1)
      ]
    }

    return { unsubscribe }
  }


  /**
    Merges a hierarchy descriptor into the existing hierarchy descriptor.
  */
  const use = newHierarchy => {
    currentHierarchy = mergeHierarchyDescriptorNodes(
      currentHierarchy,
      newHierarchy
    )

    rootReactor = hierarchyNodeToReactor(
      currentHierarchy,
      nodeOptions,
      registerSubStore
    )

    if (rootReactor) dispatch({ type: actionTypes.RECALCULATE })

    return store // for chaining
  }


  function dispatchHydration(newState, actionType = actionTypes.HYDRATE) {
    if (newState === currentState) return // nothing to do

    let action = {
      type: actionType,
      payload: newState
    }

    dispatchToInspectors(action)

    // Propagate the change to child stores
    dispatchToReducers(action, newState)
  }


  function dispatchInducer(inducer) {
    const partialStateTree = inducer(currentState)

    setState(partialStateTree)

    return currentState
  }


  function dispatchToInspectors(action) {
    inspectors = nextInspectors

    inspectors.forEach(
      inspector => inspector(storeBase, action)
    )
  }


  function dispatchToProcessors(action) {
    if (!rootReactor) return

    const { process } = rootReactor

    if (typeof process === 'function') process(dispatch, action, currentState)
  }


  function dispatchToReducers(action, rootState = currentState) {
    isDispatchingToReducers = true

    let newState

    try {
      newState = rootReactor
        ? rootReactor(rootState, action)
        : rootState
    } finally {
      isDispatchingToReducers = false
    }

    informSubscribers(newState)
  }


  function informSubscribers(newState, oldState = currentState) {

    // There is a case here where a reducer in this store could
    // dispatch an action to a parent or child store. Investigate
    // ways to handle this.

    if (newState === currentState) return // nothing to do

    // The state has changed; update it
    currentState = newState

    subscribers = nextSubscribers

    subscribers.forEach(
      subscriber => subscriber(oldState, newState)
    )
  }


  function registerSubStore(subStorePath, subStore) {
    subStore.inspect((storeBase, action) => {

      // If this store delegated this action in the first place, ignore it
      if (hasMeta(action, metaTypes.INHERIT)) return

      const wrappedAction = addMeta(action, metaTypes.DELEGATE, subStorePath)

      dispatchToInspectors(wrappedAction)
    })


    subStore.subscribe((prevSubStoreState, newSubStoreState) => {

      // If this store's reducer layer dispatched this action to this
      // substore in the first place, ignore the propagation; this store
      // will receive it anyway.
      if (isDispatchingToReducers) return

      const newState = propagateChange(
        currentState,
        subStorePath,
        newSubStoreState,
        nodeOptions
      )

      informSubscribers(newState)
    })
  }


  const store = {
    dispatch,
    getState,
    hydrate,
    inspect,
    setNodeOptions,
    setState,
    subscribe,
    use,
    $$typeof: STORE_IDENTIFIER
  }


  const storeBase = {
    dispatch,
    getState
  }


  return store
}
