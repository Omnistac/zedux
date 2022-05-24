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
  Subscriber,
  SubscriberObject,
} from '../types'
import {
  detailedTypeof,
  DEV,
  INTERNAL_SUBSCRIBER_ID,
  isPlainObject,
  STORE_IDENTIFIER,
} from '../utils/general'
import * as defaultHierarchyConfig from '../utils/hierarchyConfig'
import { DiffNode } from '../utils/types'
import { actionTypes, metaTypes } from './constants'
import { addMeta, removeAllMeta } from './meta'

const RECALCULATE_ACTION = { type: actionTypes.RECALCULATE }

/**
  Creates a new Zedux store.
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
  return new Store<State>(initialHierarchy, initialState)
}

export class Store<State = any> {
  /**
    Used by the store's branch reducers in the generated reducer hierarchy to
    interact with the hierarchical data type returned by the store's reducers.

    This "hierarchical data type" is a plain object by default. But these
    hierarchy config options can teach Zedux how to use an Immutable `Map` or
    any recursive, map-like data structure.
  */
  static readonly hierarchyConfig: HierarchyConfig = defaultHierarchyConfig
  static readonly $$typeof = STORE_IDENTIFIER

  private _currentDiffTree?: DiffNode
  private _currentState: State
  private _isDispatching?: boolean
  private _rootReducer?: Reducer<State>
  private _subscribers = new Map<SubscriberObject, boolean>()

  constructor(
    initialHierarchy?: HierarchyDescriptor<State>,
    initialState?: State
  ) {
    this._currentState = initialState as State

    if (initialHierarchy) this.use(initialHierarchy)
  }

  /**
    Dispatches an action to the store.

    The action will be sent through this store's reducer hierarchy (if any) and
    passed on to any child stores after being wrapped in INHERIT meta nodes

    The resulting state will be returned synchronously from this call.

    This is a bound function property. Every store recreates this small
    function. But it's always bound and can be passed around easily.
  */
  public dispatch = (action: Dispatchable) => this._dispatch(action)

  /**
    Returns the current state of the store.

    Do not mutate the returned value.
  */
  public getState() {
    if (DEV && this._isDispatching) {
      throw new Error('Zedux: store.getState() cannot be called in a reducer')
    }

    return this._currentState
  }

  /**
    Applies a full hydration to the store.

    Accepts either the new state or a function that accepts the current state
    and returns the new state.

    Dispatches the special HYDRATE action to the store's reducers. Effects
    subscribers can inspect and record this action to implement time travel.

    The HYDRATE action's `payload` property will be set to the new state. The
    action's `meta` property will be set to the passed meta, if any.

    Throws an error if called from the reducer layer.

    Returns the new state.

    Unlike setStateDeep, setState is a bound function property. Every store
    recreates this small function. But it's always bound and can be passed
    around easily.
  */
  public setState = (settable: Settable<State>, meta?: any) =>
    this._setState(settable as Settable<RecursivePartial<State>, State>, meta)

  /**
    Applies a partial state update to the store.

    Accepts either a deep partial state object or a function that accepts the
    current state and returns a deep partial state object.

    Dispatches the special PARTIAL_HYDRATE action to the store's reducers.
    Effects subscribers can inspect and record this action to implement time
    travel.

    The PARTIAL_HYDRATE action's `payload` property will be set to the partial
    state update.

    Note that deep setting cannot remove properties from the state tree. If that
    functionality is needed, use store.setState() or create a new reducer
    hierarchy and pass it to store.use().

    Throws an error if called from the reducer layer.

    Returns the new state.

    Unlike setState, setStateDeep is not bound. You must call it with context -
    e.g. by using dot-notation: `store.setStateDeep(...)`
  */
  public setStateDeep(
    settable: Settable<RecursivePartial<State>, State>,
    meta?: any
  ) {
    return this._setState(settable, meta, true)
  }

  /**
    Registers a subscriber with the store.

    The subscriber will be notified every time the store's state
    changes.

    Returns a subscription object. Calling `subscription.unsubscribe()`
    unregisters the subscriber.
  */
  public subscribe(subscriber: Subscriber<State, this>) {
    const subscriberObj =
      typeof subscriber === 'function' ? { next: subscriber } : subscriber

    if (DEV) {
      if (subscriberObj.next && typeof subscriberObj.next !== 'function') {
        throw new TypeError(
          `Zedux: store.subscribe() expects either a function or an object with a "next" property whose value is a function. Received: ${detailedTypeof(
            subscriberObj.next
          )}`
        )
      }

      if (subscriberObj.error && typeof subscriberObj.error !== 'function') {
        throw new TypeError(
          `Zedux: store.subscribe() - subscriber.error must be a function. Received: ${detailedTypeof(
            subscriberObj.error
          )}`
        )
      }

      if (
        subscriberObj.effects &&
        typeof subscriberObj.effects !== 'function'
      ) {
        throw new TypeError(
          `Zedux: store.subscribe() - subscriber.effects must be a function. Received: ${detailedTypeof(
            subscriberObj.effects
          )}`
        )
      }
    }

    // as any - this "id" field is hidden from the outside world
    // so it doesn't exist on the Subscriber type
    this._subscribers.set(
      subscriberObj as SubscriberObject,
      (subscriberObj as any).id === INTERNAL_SUBSCRIBER_ID
    )

    return {
      unsubscribe: () => {
        this._subscribers.delete(subscriberObj as SubscriberObject)
      },
    }
  }

  /**
    Merges a hierarchy descriptor into the existing hierarchy descriptor.

    Intelligently diffs the two hierarchies and only creates/recreates the
    necessary reducers.

    Dispatches the special RECALCULATE action to the store.
  */
  public use(newHierarchy: HierarchyDescriptor<State>) {
    const newDiffTree = hierarchyDescriptorToDiffTree(
      newHierarchy,
      this._registerChildStore.bind(this)
    )

    this._currentDiffTree = mergeDiffTrees(
      this._currentDiffTree,
      newDiffTree,
      (this.constructor as typeof Store).hierarchyConfig
    )
    this._rootReducer = this._currentDiffTree.reducer

    if (this._rootReducer) {
      this._dispatchAction(
        RECALCULATE_ACTION,
        RECALCULATE_ACTION,
        this._currentState
      )
    }

    return this // for chaining
  }

  private _dispatch(action: Dispatchable) {
    if (DEV && typeof action === 'function') {
      throw new TypeError(
        'Zedux: store.dispatch() - Thunks are not currently supported. Only normal action objects can be passed to store.dispatch(). Inducers should be passed to store.setState()'
      )
    }

    if (DEV && !isPlainObject(action)) {
      throw new TypeError(
        `Zedux: store.dispatch() - Action must be a plain object. Received ${detailedTypeof(
          action
        )}`
      )
    }

    const delegateResult = delegate(this._currentDiffTree, action)

    if (delegateResult !== false) {
      // No need to inform subscribers - this store's effects subscriber
      // on the child store will have already done that by this point
      return this._currentState
    }

    return this._routeAction(action)
  }

  private _dispatchAction(
    action: ActionChain,
    unwrappedAction: Action,
    rootState: State
  ) {
    if (DEV && this._isDispatching) {
      throw new Error(
        'Zedux: dispatch(), setState(), and setStateDeep() cannot be called in a reducer'
      )
    }

    this._isDispatching = true

    let error: unknown
    let newState = rootState

    try {
      if (this._rootReducer) {
        newState = this._rootReducer(rootState, unwrappedAction)
      }
    } catch (err) {
      error = err

      throw err
    } finally {
      this._isDispatching = false

      this._informSubscribers(newState, action, undefined, error)
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
  private _dispatchHydration<State = any>(
    state: RecursivePartial<State>,
    actionType: string,
    meta?: any
  ) {
    const newState =
      actionType === actionTypes.HYDRATE
        ? state
        : mergeStateTrees(
            this._currentState,
            state,
            (this.constructor as typeof Store).hierarchyConfig
          )[0]

    if (newState === this._currentState) {
      // Nothing to do. TODO: Should this inform effects subscribers?
      return this._currentState
    }

    const action: Action = {
      payload: newState,
      type: actionType,
    }

    if (meta != null) action.meta = meta

    // Maybe we can provide a utility for setting a description for the
    // hydration. Then wrap the action in an ActionMeta with that description
    // as the metaData.

    // Propagate the change to child stores and allow for effects.
    return this._dispatchAction(action, action, newState)
  }

  private _dispatchInducer(
    inducer: Inducer<State>,
    meta?: any,
    deep?: boolean
  ) {
    let newState

    try {
      newState = inducer(this._currentState)
    } catch (error) {
      this._informSubscribers(
        this._currentState,
        { type: actionTypes.PARTIAL_HYDRATE },
        undefined,
        error
      )

      throw error
    }

    return this._dispatchHydration(
      newState,
      deep ? actionTypes.PARTIAL_HYDRATE : actionTypes.HYDRATE,
      meta
    )
  }

  private _informSubscribers(
    newState: State,
    action?: ActionChain,
    effect?: EffectChain,
    error?: unknown
  ) {
    const oldState = this._currentState

    // There is a case here where a reducer in this store could
    // dispatch an action to a parent or child store. Investigate
    // ways to handle this.

    // Update the stored state
    this._currentState = newState

    let infoObj: EffectData<State, this> | undefined

    // Clone the subscribers in case of mutation mid-iteration
    const subscribers = [...this._subscribers.keys()]

    for (const subscriber of subscribers) {
      if (error && subscriber.error) subscriber.error(error)

      if (newState !== oldState && subscriber.next) {
        subscriber.next(newState, oldState, action as ActionChain)
      }

      if (!subscriber.effects) continue

      if (!infoObj) {
        infoObj = {
          action,
          effect,
          error,
          newState,
          oldState,
          store: this,
        }
      }

      subscriber.effects(infoObj)
    }
  }

  private _registerChildStore<State = any>(
    childStorePath: string[],
    childStore: Store
  ) {
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
      if (this._isDispatching) return

      const newOwnState =
        newState === oldState
          ? this._currentState
          : propagateChange(
              this._currentState,
              childStorePath,
              newState,
              (this.constructor as typeof Store).hierarchyConfig
            )

      // Tell the subscribers what child store this effect came from.
      const wrappedEffect =
        effect && addMeta(effect, metaTypes.DELEGATE, childStorePath)

      // Tell the subscribers what child store this action came from.
      // This store (the parent) can use this info to determine how to
      // recreate this state update.
      const wrappedAction =
        action && addMeta(action, metaTypes.DELEGATE, childStorePath)

      this._informSubscribers(newOwnState, wrappedAction, wrappedEffect, error)
    }

    return childStore.subscribe({
      effects: effectsSubscriber,
      id: INTERNAL_SUBSCRIBER_ID,
    } as any).unsubscribe
  }

  private _routeAction(action: ActionChain) {
    const unwrappedAction = removeAllMeta(action)

    if (DEV && typeof unwrappedAction.type !== 'string') {
      throw new TypeError(
        `Zedux: store.dispatch() - Action must have a string "type" property. Received ${detailedTypeof(
          unwrappedAction.type
        )}`
      )
    }

    if (unwrappedAction.type === actionTypes.HYDRATE) {
      return this._dispatchHydration(
        unwrappedAction.payload,
        actionTypes.HYDRATE,
        unwrappedAction.meta
      )
    }

    if (unwrappedAction.type === actionTypes.PARTIAL_HYDRATE) {
      return this._dispatchHydration(
        unwrappedAction.payload,
        actionTypes.PARTIAL_HYDRATE,
        unwrappedAction.meta
      )
    }

    return this._dispatchAction(action, unwrappedAction, this._currentState)
  }

  private _setState(
    settable: Settable<RecursivePartial<State>, State>,
    meta?: any,
    deep = false
  ) {
    if (typeof settable === 'function') {
      return this._dispatchInducer(settable as Inducer<State>, meta, deep)
    }

    return this._dispatchHydration(
      settable,
      deep ? actionTypes.PARTIAL_HYDRATE : actionTypes.HYDRATE,
      meta
    )
  }
}
