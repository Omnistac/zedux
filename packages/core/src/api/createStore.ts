import { hierarchyDescriptorToDiffTree } from '../hierarchy/create'
import { mergeDiffTrees, mergeStateTrees } from '../hierarchy/merge'
import { delegate, propagateChange } from '../hierarchy/traverse'
import {
  Action,
  ActionChain,
  Dispatchable,
  StoreEffect,
  EffectsSubscriber,
  HierarchyConfig,
  HierarchyDescriptor,
  SetState,
  RecursivePartial,
  Reducer,
  Settable,
  Subscriber,
  SubscriberObject,
  Scheduler,
  Job,
} from '../types'
import {
  detailedTypeof,
  isPlainObject,
  STORE_IDENTIFIER,
} from '../utils/general'
import * as defaultHierarchyConfig from '../utils/hierarchyConfig'
import { DiffNode } from '../utils/types'
import { internalTypes } from './constants'
import { addMeta, removeAllMeta } from './meta'

// When an action is dispatched to a parent store and delegated to a child
// store, the child store needs to wait until the update propagates everywhere
// and the parent store finishes its dispatch before notifying its subscribers.
// A proper scheduler will allow all child stores of the currently-dispatching
// parent store to wait to notify their subscribers until all stores in the
// hierarchy are done dispatching.
const defaultScheduler: Scheduler = {
  scheduleNow: (job: Job) => job.task(),
}

const primeAction = { type: internalTypes.prime }

/**
  Creates a new Zedux store.
*/
export const createStore: {
  <State = any>(
    initialHierarchy?: HierarchyDescriptor<State>,
    initialState?: State
  ): Store<State>

  <State = any>(
    initialHierarchy: null | undefined,
    initialState: State
  ): Store<State>
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

  /**
   * This is set by atom ecosystems to automaticallly tie stores created during
   * atom evaluation to the ecosystem.
   */
  static _scheduler?: Scheduler
  private _currentDiffTree?: DiffNode
  private _currentState: State
  private _isDispatching?: boolean
  private _parents?: EffectsSubscriber[]
  private _rootReducer?: Reducer<State>
  private _scheduler: Scheduler
  private _subscribers: SubscriberObject[] = []

  constructor(
    initialHierarchy?: HierarchyDescriptor<State>,
    initialState?: State
  ) {
    this._currentState = initialState as State
    this._scheduler = Store._scheduler || defaultScheduler

    if (initialHierarchy) this.use(initialHierarchy)
  }

  public actionStream() {
    return {
      [Symbol.observable]() {
        return this
      },
      '@@observable'() {
        return this
      },
      subscribe: (
        subscriber:
          | {
              complete?: () => void
              error?: (error: unknown) => void
              next?: (action: ActionChain) => void
            }
          | ((action: ActionChain) => void)
      ) => {
        return this.subscribe({
          effects: ({ action, error }) => {
            if (error && typeof subscriber !== 'function') {
              subscriber.error?.(error)
            } else if (action) {
              typeof subscriber === 'function'
                ? subscriber(action)
                : subscriber.next?.(action)
            }
          },
        })
      },
    }
  }

  /**
    Dispatches an action to the store.

    The action will be sent through this store's reducer hierarchy (if any) and
    passed on to any child stores after being wrapped in `inherit` meta nodes

    The resulting state will be returned synchronously from this call.

    This is a bound function property. Every store recreates this small
    function. But it's always bound and can be passed around easily.
  */
  public dispatch = (action: Dispatchable) => {
    this._scheduler.scheduleNow({
      task: () => this._dispatch(action),
      type: 0, // UpdateStore (0)
    })

    return this._currentState
  }

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

    Dispatches the special `hydrate` action to the store's reducers. Effects
    subscribers can inspect and record this action to implement time travel.

    The `hydrate` action's `payload` property will be set to the new state. The
    action's `meta` property will be set to the passed meta, if any.

    Throws an error if called from the reducer layer.

    Returns the new state.

    Unlike setStateDeep, setState is a bound function property. Every store
    recreates this small function. But it's always bound and can be passed
    around easily.
  */
  public setState = (settable: Settable<State>, meta?: any) => {
    this._scheduler.scheduleNow({
      task: () =>
        this._setState(
          settable as Settable<RecursivePartial<State>, State>,
          meta
        ),
      type: 0, // UpdateStore (0)
    })

    return this._currentState
  }

  /**
    Applies a partial state update to the store.

    Accepts either a deep partial state object or a function that accepts the
    current state and returns a deep partial state object.

    Dispatches the special `merge` action to the store's reducers.
    Effects subscribers can inspect and record this action to implement time
    travel.

    The `merge` action's `payload` property will be set to the partial
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
    this._scheduler.scheduleNow({
      task: () =>
        this._setState(
          settable as Settable<RecursivePartial<State>, State>,
          meta,
          true
        ),
      type: 0, // UpdateStore (0)
    })

    return this._currentState
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

    this._subscribers.push(subscriberObj as SubscriberObject)

    return {
      unsubscribe: () => {
        const index = this._subscribers.indexOf(
          subscriberObj as SubscriberObject
        )

        if (index > -1) this._subscribers.splice(index, 1)
      },
    }
  }

  /**
    Merges a hierarchy descriptor into the existing hierarchy descriptor.

    Intelligently diffs the two hierarchies and only creates/recreates the
    necessary reducers.

    Dispatches the special `prime` action to the store.
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
      this._dispatchAction(primeAction, primeAction, this._currentState)
    }

    return this // for chaining
  }

  /**
   * Only for internal use.
   */
  public _register(effects: EffectsSubscriber) {
    const parents = this._parents || (this._parents = [])
    parents.push(effects)

    return () => {
      const index = parents.indexOf(effects)

      if (index > -1) parents.splice(index, 1)
    }
  }

  public [Symbol.observable]() {
    return this
  }

  public '@@observable'() {
    return this
  }

  private _dispatch(action: Dispatchable) {
    if (DEV && typeof action === 'function') {
      throw new TypeError(
        'Zedux: store.dispatch() - Thunks are not currently supported. Only normal action objects can be passed to store.dispatch(). For zero-config stores, you can pass a function to store.setState()'
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

      this._informSubscribers(newState, action, error)
    }

    return newState
  }

  /**
    "Hydrates" the store with the given state.

    Dispatches the special `hydrate` action to the store's inspectors
    and reducers. The `hydrate` action's `payload` property will be
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
      actionType === internalTypes.hydrate
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

  private _dispatchStateSetter(
    getState: SetState<State>,
    meta?: any,
    deep?: boolean
  ) {
    let newState

    try {
      newState = getState(this._currentState)
    } catch (error) {
      this._informSubscribers(
        this._currentState,
        { type: internalTypes.merge },
        error
      )

      throw error
    }

    return this._dispatchHydration(
      newState,
      deep ? internalTypes.merge : internalTypes.hydrate,
      meta
    )
  }

  private _finishInforming(effect: StoreEffect<State, this>) {
    // Clone the subscribers in case of mutation mid-iteration
    const subscribers = [...this._subscribers]

    for (let i = 0; i < subscribers.length; i++) {
      const subscriber = subscribers[i]

      if (effect.error && subscriber.error) subscriber.error(effect.error)

      if (effect.newState !== effect.oldState && subscriber.next) {
        subscriber.next(
          effect.newState,
          effect.oldState,
          effect.action as ActionChain
        )
      }

      if (subscriber.effects) subscriber.effects(effect)
    }
  }

  private _informSubscribers(
    newState: State,
    action?: ActionChain,
    error?: unknown
  ) {
    const effect: StoreEffect<State, this> = {
      action,
      error,
      newState,
      oldState: this._currentState,
      store: this,
    }

    // Update the stored state
    this._currentState = newState

    // defer informing if a parent store is currently dispatching
    this._scheduler.scheduleNow({
      task: () => this._finishInforming(effect),
      type: 1, // InformSubscribers (1)
    })

    this._parents?.forEach(parent => parent(effect))
  }

  private _registerChildStore<State = any>(
    childStorePath: string[],
    childStore: Store
  ) {
    const effectsSubscriber: EffectsSubscriber<State> = ({
      action,
      error,
      newState,
      oldState,
    }) => {
      // If this store's reducer layer dispatched this action to this
      // substore in the first place, ignore the propagation; this store
      // will receive it anyway.
      // const isInherited = hasMeta(action, internalTypes.inherit)
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

      // Tell the subscribers what child store this action came from.
      // This store (the parent) can use this info to determine how to
      // recreate this state update.
      const wrappedAction =
        action && addMeta(action, internalTypes.delegate, childStorePath)

      this._informSubscribers(newOwnState, wrappedAction, error)
    }

    return childStore._register(effectsSubscriber)
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

    if (
      unwrappedAction.type === internalTypes.hydrate ||
      unwrappedAction.type === internalTypes.merge
    ) {
      return this._dispatchHydration(
        unwrappedAction.payload,
        unwrappedAction.type,
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
      return this._dispatchStateSetter(settable as SetState<State>, meta, deep)
    }

    return this._dispatchHydration(
      settable,
      deep ? internalTypes.merge : internalTypes.hydrate,
      meta
    )
  }
}
