import { hierarchyDescriptorToHierarchy } from '../hierarchy/create'
import { mergeHierarchies, mergeStateTrees } from '../hierarchy/merge'
import { delegate, propagateChange } from '../hierarchy/traverse'
import {
  Action,
  ActionChain,
  Dispatchable,
  StoreEffect,
  EffectsSubscriber,
  HierarchyDescriptor,
  SetState,
  RecursivePartial,
  Reducer,
  StoreSettable,
  Subscriber,
  SubscriberObject,
  KnownHierarchyDescriptor,
} from '../types'
import { STORE_IDENTIFIER } from '../utils/general'
import { getScheduler } from '../utils/scheduler'
import { HierarchyNode } from '../utils/types'
import { detailedTypeof } from './detailedTypeof'
import { isPlainObject } from './isPlainObject'
import { removeAllMeta } from './meta'
import { zeduxTypes } from './zeduxTypes'

const primeAction = { type: zeduxTypes.prime }

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
  static readonly $$typeof = STORE_IDENTIFIER

  /**
   * `s`cheduler - a reference to the instance of the atoms package's
   * `SyncScheduler` for the ecosystem of the atom that created this store.
   */
  public static s?: { post(): void; pre(): void }

  private _state: State
  private _isDispatching?: boolean
  private _parents?: EffectsSubscriber[]
  private _rootReducer?: Reducer<State>
  private _subscribers: SubscriberObject[] = []
  private _tree?: HierarchyNode

  /**
   * `s`cheduler - a reference to the instance of the atoms package's
   * `SyncScheduler` for the ecosystem of the atom that created this store.
   */
  public s?: { post(): void; pre(): void }

  constructor(
    initialHierarchy?: HierarchyDescriptor<State>,
    initialState?: State
  ) {
    this._state = initialState as State
    this.s = Store.s

    if (initialHierarchy) {
      this.use(initialHierarchy as KnownHierarchyDescriptor<State>)
    }
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
    if (action.meta !== zeduxTypes.batch) this.s?.pre()
    getScheduler().s({
      j: () => this._dispatch(action),
      T: 0, // UpdateStore (0)
    })
    if (action.meta !== zeduxTypes.batch) this.s?.post()

    return this._state
  }

  /**
    Returns the current state of the store.

    Do not mutate the returned value.
  */
  public getState() {
    if (DEV && this._isDispatching) {
      throw new Error('Zedux: store.getState() cannot be called in a reducer')
    }

    return this._state
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
  public setState = (settable: StoreSettable<State>, meta?: any) => {
    if (meta !== zeduxTypes.batch) this.s?.pre()
    getScheduler().s({
      j: () =>
        this._setState(
          settable as StoreSettable<RecursivePartial<State>, State>,
          meta
        ),
      T: 0, // UpdateStore (0)
    })
    if (meta !== zeduxTypes.batch) this.s?.post()

    return this._state
  }

  /**
    Applies a partial state update to the store.

    Accepts either a deep partial state object or a function that accepts the
    current state and returns a deep partial state object.

    This method only recursively traverses normal JS objects. If your store
    deeply nests any other data structure, including arrays or maps, you'll have
    to deeply merge them yourself using `store.setState()`.

    Dispatches the special `merge` action to the store's reducers. This action's
    `payload` property will be set to the resolved partial state update. Effects
    subscribers can record this action to implement time travel.

    IMPORTANT: Deep setting cannot remove properties from the state tree. Use
    `store.setState()` for that.

    Throws an error if called from the reducer layer.

    Returns the new state.

    Unlike setState, setStateDeep is not bound. You must call it with context -
    e.g. by using dot-notation: `store.setStateDeep(...)`
  */
  public setStateDeep(
    settable: StoreSettable<RecursivePartial<State>, State>,
    meta?: any
  ) {
    if (meta !== zeduxTypes.batch) this.s?.pre()
    getScheduler().s({
      j: () =>
        this._setState(
          settable as StoreSettable<RecursivePartial<State>, State>,
          meta,
          true
        ),
      T: 0, // UpdateStore (0)
    })
    if (meta !== zeduxTypes.batch) this.s?.post()

    return this._state
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

    const subscription = {
      unsubscribe: () => {
        // Zedux stores rarely have more than 2-3 subscribers (most
        // "subscriptions" are handled by the atom graph in the @zedux/atoms
        // package). Array filter is the fastest way to immutably remove items
        // from such small lists (compared to Array toSpliced, Array cloning and
        // splicing, Array spreading slices, Map clone and delete, and Object
        // clone and delete. Benchmark: https://jsbench.me/4ylihvvpo6)
        this._subscribers = this._subscribers.filter(
          obj => obj !== subscriberObj
        )
      },
    }

    return subscription
  }

  /**
    Merges a hierarchy descriptor into the existing hierarchy descriptor.

    Intelligently diffs the two hierarchies and only creates/recreates the
    necessary reducers.

    Dispatches the special `prime` action to the store.
  */
  public use(newHierarchy: KnownHierarchyDescriptor<State>) {
    const newTree = hierarchyDescriptorToHierarchy(
      newHierarchy,
      (childStorePath: string[], childStore: Store) =>
        this._registerChildStore(childStorePath, childStore)
    )

    const tree = (this._tree = mergeHierarchies(this._tree, newTree))

    if ((this._rootReducer = tree.reducer)) {
      this._dispatchAction(primeAction, primeAction, this._state)
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

    const delegateResult = delegate(this._tree, action)

    if (delegateResult !== false) {
      // No need to inform subscribers - this store's effects subscriber
      // on the child store will have already done that by this point
      return this._state
    }

    this._routeAction(action)
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

      this._notify(newState, action, error)
    }

    return newState
  }

  private _dispatchHydration<State = any>(
    state: RecursivePartial<State>,
    actionType: string,
    meta?: any
  ) {
    const newState =
      actionType === zeduxTypes.hydrate
        ? state
        : mergeStateTrees(this._state, state)[0]

    // short-circuit if there's no change and no metadata that needs to reach
    // this (or a parent/child) store's effects subscribers
    if (newState === this._state && !meta) {
      return this._state
    }

    const action: Action = {
      meta,
      payload: newState,
      type: actionType,
    }

    // Propagate the change to child stores
    return this._dispatchAction(action, action, newState)
  }

  private _dispatchStateSetter(
    getState: SetState<State>,
    meta?: any,
    deep?: boolean
  ) {
    let newState

    try {
      newState = getState(this._state)
    } catch (error) {
      if (DEV) {
        throw new (Error as any)(
          `Zedux: encountered an error while running a state setter passed to store.setState${
            deep ? 'Deep' : ''
          }()`,
          { cause: error }
        )
      }

      throw error
    }

    return this._dispatchHydration(
      newState,
      deep ? zeduxTypes.merge : zeduxTypes.hydrate,
      meta
    )
  }

  private _doNotify(effect: StoreEffect<State, this>) {
    // the subscribers array is replaced when anyone unsubscribes
    const { _subscribers } = this
    const hasChanged = effect.newState !== effect.oldState

    for (const subscriber of _subscribers) {
      if (effect.error && subscriber.error) subscriber.error(effect.error)

      if (hasChanged && subscriber.next) {
        subscriber.next(
          effect.newState,
          effect.oldState,
          effect.action as ActionChain
        )
      }

      if (subscriber.effects) subscriber.effects(effect)
    }
  }

  private _notify(newState: State, action: ActionChain, error?: unknown) {
    const effect: StoreEffect<State, this> = {
      action,
      error,
      newState,
      oldState: this._state,
      store: this,
    }

    // Update the stored state
    this._state = newState

    // defer informing if a parent store is currently dispatching
    getScheduler().s({
      j: () => this._doNotify(effect),
      T: 1, // InformSubscribers (1)
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
      // If this store's reducer layer dispatched this action to this substore
      // in the first place, ignore the propagation; this store is already going
      // to notify its own subscribers of it.
      if (this._isDispatching) return

      const newOwnState =
        newState === oldState
          ? this._state
          : propagateChange(this._state, childStorePath, newState)

      // Tell the subscribers what child store this action came from. This store
      // (the parent) can use this info to determine how to recreate this state
      // update.
      const wrappedAction = {
        metaType: zeduxTypes.delegate,
        metaData: childStorePath,
        payload: action,
      }

      this._notify(newOwnState, wrappedAction, error)
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
      unwrappedAction.type === zeduxTypes.hydrate ||
      unwrappedAction.type === zeduxTypes.merge
    ) {
      return this._dispatchHydration(
        unwrappedAction.payload,
        unwrappedAction.type,
        unwrappedAction.meta
      )
    }

    return this._dispatchAction(action, unwrappedAction, this._state)
  }

  private _setState(
    settable: StoreSettable<RecursivePartial<State>, State>,
    meta?: any,
    deep = false
  ) {
    if (typeof settable === 'function') {
      return this._dispatchStateSetter(settable as SetState<State>, meta, deep)
    }

    return this._dispatchHydration(
      settable,
      deep ? zeduxTypes.merge : zeduxTypes.hydrate,
      meta
    )
  }
}
