import $$observable from 'symbol-observable'

import { actionTypes, effectTypes, metaTypes } from './constants'
import { hierarchyDescriptorToDiffTree } from '../hierarchy/create'
import { mergeDiffTrees, mergeStateTrees } from '../hierarchy/merge'
import { delegate, propagateChange } from '../hierarchy/traverse'

import {
  assert,
  assertAreValidEffects,
  assertIsValidAction,
  assertIsValidNodeOption,
  assertIsPlainObject,
  getError,
  invalidAccess,
} from '../utils/errors'

import { STORE_IDENTIFIER } from '../utils/general'
import { addMeta, hasMeta, removeAllMeta } from '../utils/meta'

import * as defaultNodeOptions from '../utils/nodeOptions'


/**
  Creates a new Zedux store.

  A store is just a collection of functions and a special $$typeof
  symbol that identifies it internally.

  Zedux stores are fast, composable, and pretty much just awesome.
*/
export const createStore = initialHierarchy => {
  let nodeOptions = { ...defaultNodeOptions }
  let currentDiffTree
  let currentState
  let isDispatching = false
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

    const delegateReply = delegate(currentDiffTree, action)

    if (delegateReply) {
      return {
        ...delegateReply,
        state: currentState
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
  const hydrate = newState => {
    dispatchHydration(newState)

    return store // for chaining
  }


  /**
    Sets one or more node options that will be used by the store's
    intermediate reactors in the generated reactor hierarchy to
    interact with the hierarchical data type returned by the store's
    reducers. There is sense in that sentence, believe me.

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
    const newState = mergeStateTrees(
      currentState,
      partialStateTree,
      nodeOptions
    )

    return dispatchHydration(newState, actionTypes.PARTIAL_HYDRATE)
  }


  /**
    Registers a subscriber with the store.

    The subscriber will be notified every time the store's state
    changes.

    Returns a subscription object. Calling `subscription.unsubscribe()`
    unregisters the subscriber.
  */
  const subscribe = subscriber => {
    const subscriberObj = typeof subscriber === 'function'
      ? { next: subscriber }
      : subscriber

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
      }
    }
  }


  /**
    Merges a hierarchy descriptor into the existing hierarchy descriptor.

    Intelligently diffs the two hierarchies and only creates/recreates the
    necessary reactors.

    Dispatches the special RECALCULATE action to the store.
  */
  const use = newHierarchy => {
    const newDiffTree = hierarchyDescriptorToDiffTree(
      newHierarchy,
      registerChildStore
    )

    currentDiffTree = mergeDiffTrees(currentDiffTree, newDiffTree, nodeOptions)
    rootReactor = currentDiffTree.reactor

    if (rootReactor) dispatch({ type: actionTypes.RECALCULATE })

    return store // for chaining
  }


  function dispatchAction(action, unwrappedAction, rootState = currentState) {
    if (isDispatching) {
      throw new Error(invalidAccess('dispatch(), hydrate(), setState()'))
    }

    isDispatching = true

    const effects = []
    let error = null
    let newState = rootState

    if (!hasMeta(action, metaTypes.INHERIT)) {
      effects.push(getDispatchEffect(action))
    }

    try {
      if (!hasMeta(action, metaTypes.SKIP_REDUCERS)) {
        newState = dispatchToReducers(unwrappedAction, rootState)
      }

      if (!hasMeta(action, metaTypes.SKIP_EFFECTS)) {
        effects.push(...dispatchToEffects(unwrappedAction))
      }
    } catch (err) {
      error = err
    } finally {
      isDispatching = false
    }

    informSubscribers(action, error, newState, effects)

    return {
      effects,
      error,
      state: newState
    }
  }


  function dispatchHydration(newState, actionType = actionTypes.HYDRATE) {
    if (newState === currentState) {

      // nothing to do
      return {
        effects: [],
        error: null,
        state: currentState
      }
    }

    const action = {
      type: actionType,
      payload: newState
    }

    // Maybe we can provide a utility for setting a description for the
    // hydration. Then wrap the action in a meta node with that description
    // as the metaData.

    // Propagate the change to child stores and allow for effects.
    return dispatchAction(action, action, newState)
  }


  function dispatchInducer(inducer) {
    const partialStateTree = inducer(currentState)

    return setState(partialStateTree)
  }


  function getDispatchEffect(action) {
    return {
      effectType: effectTypes.DISPATCH,
      payload: action
    }
  }


  function dispatchToEffects(action) {
    if (!rootReactor) return []

    const { effects } = rootReactor

    if (typeof effects !== 'function') return []

    const receivedEffects = effects(currentState, action)

    assertAreValidEffects(receivedEffects)

    return receivedEffects || []
  }


  function dispatchToReducers(action, rootState) {
    return rootReactor
      ? rootReactor(rootState, action)
      : rootState
  }


  function informSubscribers(
    action,
    error,
    newState,
    effects
  ) {
    const oldState = currentState

    // There is a case here where a reducer in this store could
    // dispatch an action to a parent or child store. Investigate
    // ways to handle this.

    // Update the stored state
    currentState = newState

    // Clone the subscribers in case of mutation mid-iteration
    ;[ ...subscribers ].forEach(subscriber => {
      if (error && subscriber.error) subscriber.error(error)

      if (newState !== oldState && subscriber.next) {
        subscriber.next(newState, oldState)
      }

      if (!subscriber.effects) return

      subscriber.effects({ action, effects, error, newState, oldState, store })
    })
  }


  function registerChildStore(childStorePath, childStore) {
    const effectsHandler = ({ action, effects, error, newState, oldState }) => {

      // If this store's reducer layer dispatched this action to this
      // substore in the first place, ignore the propagation; this store
      // will receive it anyway.
      if (isDispatching) return

      const newOwnState = newState === oldState
        ? currentState
        : propagateChange(
          currentState,
          childStorePath,
          newState,
          nodeOptions
        )

      const wrappedEffects = effects

        // If this store delegated this action in the first place, ignore it
        .filter(effect => !hasMeta(effect, metaTypes.INHERIT))

        // Tell the subscribers how to recreate this state update
        .map(effect => addMeta(effect, metaTypes.DELEGATE, childStorePath))

      informSubscribers(action, error, newOwnState, wrappedEffects)
    }

    return childStore.subscribe({ effects: effectsHandler }).unsubscribe
  }


  function routeAction(action) {
    const unwrappedAction = removeAllMeta(action)

    assertIsValidAction(unwrappedAction)
    const canHydrate = !hasMeta(action, metaTypes.SKIP_REDUCERS)

    if (unwrappedAction.type === actionTypes.HYDRATE && canHydrate) {
      return dispatchHydration(unwrappedAction.payload)
    }

    if (unwrappedAction.type === actionTypes.PARTIAL_HYDRATE && canHydrate) {
      return setState(unwrappedAction.payload)
    }

    return dispatchAction(action, unwrappedAction)
  }


  const store = {
    dispatch,
    getState,
    hydrate,
    setNodeOptions,
    setState,
    subscribe,
    use,
    ['@@observable']: () => store,
    $$typeof: STORE_IDENTIFIER
  }


  if (initialHierarchy) store.use(initialHierarchy)


  return store
}
