import {
  ActionChain,
  createStore,
  Dispatchable,
  zeduxTypes,
  is,
  RecursivePartial,
  Settable,
  Store,
  Subscription,
} from '@zedux/core'
import {
  AtomGenerics,
  AtomGenericsToAtomApiGenerics,
  AnyAtomGenerics,
} from './types'
import {
  AtomInstance as NewAtomInstance,
  Cleanup,
  Ecosystem,
  ExportsInfusedSetter,
  PromiseState,
  PromiseStatus,
  InternalEvaluationReason,
  Transaction,
  zi,
  SendableEvents,
} from '@zedux/atoms'
import { AtomApi } from './AtomApi'
import {
  prefix,
  PromiseChange,
  getErrorPromiseState,
  getInitialPromiseState,
  getSuccessPromiseState,
  InjectorDescriptor,
} from './atoms-port'
import { AtomTemplate } from './AtomTemplate'

const StoreState = 1
const RawState = 2

const getStateType = (val: any) => {
  if (is(val, Store)) return StoreState

  return RawState
}

const getStateStore = <
  State = any,
  StoreType extends Store<State> = Store<State>,
  P extends State | StoreType = State | StoreType
>(
  factoryResult: P
) => {
  const stateType = getStateType(factoryResult)

  const stateStore =
    stateType === StoreState
      ? (factoryResult as unknown as StoreType)
      : (createStore<State>() as StoreType)

  // define how we populate our store (doesn't apply to user-supplied stores)
  if (stateType === RawState) {
    stateStore.setState(
      typeof factoryResult === 'function'
        ? () => factoryResult as State
        : (factoryResult as unknown as State)
    )
  }

  return [stateType, stateStore] as const
}

export class AtomInstance<
  G extends Omit<AtomGenerics, 'Node' | 'Template'> & {
    Template: AtomTemplate<G & { Node: any }>
  } = AnyAtomGenerics<{
    Node: any
  }>
> extends NewAtomInstance<G> {
  public static $$typeof = Symbol.for(`${prefix}/AtomInstance`)

  // @ts-expect-error same as exports
  public store: G['Store']

  /**
   * @see NewAtomInstance.c
   */
  public c?: Cleanup
  public _injectors?: InjectorDescriptor[]
  public _isEvaluating?: boolean
  public _nextInjectors?: InjectorDescriptor[]
  public _promiseError?: Error
  public _promiseStatus?: PromiseStatus
  public _stateType?: typeof StoreState | typeof RawState

  private _bufferedUpdate?: {
    newState: G['State']
    oldState?: G['State']
    action: ActionChain
  }
  private _subscription?: Subscription

  constructor(
    /**
     * @see NewAtomInstance.e
     */
    public readonly e: Ecosystem,
    /**
     * @see NewAtomInstance.t
     */
    public readonly t: G['Template'],
    /**
     * @see NewAtomInstance.id
     */
    public readonly id: string,
    /**
     * @see NewAtomInstance.p
     */
    public readonly p: G['Params']
  ) {
    super(e, t, id, p)
  }

  /**
   * @see NewAtomInstance.destroy
   */
  public destroy(force?: boolean) {
    if (!zi.b(this, force)) return

    // Clean up effect injectors first, then everything else
    const nonEffectInjectors: InjectorDescriptor[] = []
    this._injectors?.forEach(injector => {
      if (injector.type !== '@@zedux/effect') {
        nonEffectInjectors.push(injector)
        return
      }
      injector.cleanup?.()
    })
    nonEffectInjectors.forEach(injector => {
      injector.cleanup?.()
    })
    this._subscription?.unsubscribe()

    zi.e(this)
  }

  /**
   * An alias for `.store.dispatch()`
   */
  public dispatch = (action: Dispatchable) => this.store.dispatch(action)

  /**
   * An alias for `instance.store.getState()`. Returns the current state of this
   * atom instance's store.
   *
   * @deprecated - use `.getOnce()` instead @see NewAtomInstance.getOnce. Also
   * see `.get()` for automatic reactivity.
   */
  public getState(): G['State'] {
    return this.store.getState()
  }

  /**
   * @see NewAtomInstance.get
   *
   * An alias for `instance.store.getState()`.
   */
  public get() {
    super.get() // register graph edge

    return this.store.getState()
  }

  /**
   * `.mutate()` is not supported in legacy, store-based atoms. Upgrade to the
   * new `atom()` factory.
   */
  public mutate(): [G['State'], Transaction[]] {
    throw new Error(
      '`.mutate()` is not supported in legacy, store-based atoms. Upgrade to the new `atom()` factory'
    )
  }

  public set(
    settable: Settable<G['State']>,
    events?: Partial<SendableEvents<G>>
  ) {
    return this.setState(settable, events && Object.keys(events)[0])
  }

  /**
   * An alias for `.store.setState()`
   */
  public setState = (settable: Settable<G['State']>, meta?: any): G['State'] =>
    this.store.setState(settable, meta)

  /**
   * An alias for `.store.setStateDeep()`
   */
  public setStateDeep = (
    settable: Settable<RecursivePartial<G['State']>, G['State']>,
    meta?: any
  ): G['State'] => this.store.setStateDeep(settable, meta)

  /**
   * @see NewAtomInstance.j
   */
  public j() {
    this._nextInjectors = []
    this._isEvaluating = true

    // all stores created during evaluation automatically belong to the
    // ecosystem. This is brittle. It's the only piece of Zedux that isn't
    // cross-window compatible. The store package would ideally have its own
    // scheduler. Unfortunately, we're probably never focusing on that since the
    // real ideal is to move off stores completely in favor of signals.
    Store._scheduler = this.e._scheduler

    const prevNode = zi.s(this)

    try {
      const newFactoryResult = this._eval()

      if (this.l === 'Initializing') {
        ;[this._stateType, this.store] = getStateStore(newFactoryResult)

        this._subscription = this.store.subscribe(
          (newState, oldState, action) => {
            // buffer updates (with cache size of 1) if this instance is currently
            // evaluating
            if (this._isEvaluating) {
              this._bufferedUpdate = { newState, oldState, action }
              return
            }

            this._handleStateChange(newState, oldState, action)
          }
        )

        this.v = this.store.getState()
      } else {
        const newStateType = getStateType(newFactoryResult)

        if (DEV && newStateType !== this._stateType) {
          throw new Error(
            `Zedux: atom factory for atom "${this.t.key}" returned a different type than the previous evaluation. This can happen if the atom returned a store initially but then returned a non-store value on a later evaluation or vice versa`
          )
        }

        if (
          DEV &&
          newStateType === StoreState &&
          newFactoryResult !== this.store
        ) {
          throw new Error(
            `Zedux: atom factory for atom "${this.t.key}" returned a different store. Did you mean to use \`injectStore()\`, or \`injectMemo()\`?`
          )
        }

        // there is no way to cause an evaluation loop when the StateType is Value
        if (newStateType === RawState) {
          this.store.setState(
            typeof newFactoryResult === 'function'
              ? () => newFactoryResult as G['State']
              : (newFactoryResult as G['State'])
          )
        }
      }
    } catch (err) {
      this._nextInjectors.forEach(injector => {
        injector.cleanup?.()
      })

      zi.d(prevNode)

      throw err
    } finally {
      this._isEvaluating = false

      // if we just popped the last thing off the stack, restore the default
      // scheduler
      if (!prevNode) Store._scheduler = undefined

      // even if evaluation errored, we need to update dependents if the store's
      // state changed
      if (this._bufferedUpdate) {
        this._handleStateChange(
          this._bufferedUpdate.newState,
          this._bufferedUpdate.oldState,
          this._bufferedUpdate.action
        )
        this._bufferedUpdate = undefined
      }

      this.w = []
    }

    this._injectors = this._nextInjectors

    if (this.l !== 'Initializing') {
      // let this.i flush updates after status is set to Active
      zi.f(prevNode)
    }
  }

  /**
   * @see NewAtomInstance.r
   */
  public r(reason: InternalEvaluationReason, shouldSetTimeout?: boolean) {
    // TODO: Any calls in this case probably indicate a memory leak on the
    // user's part. Notify them. TODO: Can we pause evaluations while
    // status is Stale (and should we just always evaluate once when
    // waking up a stale atom)?
    if (this.l !== 'Destroyed' && this.w.push(reason) === 1) {
      // refCount just hit 1; we haven't scheduled a job for this node yet
      this.e._scheduler.schedule(this, shouldSetTimeout)
    }
  }

  public _set?: ExportsInfusedSetter<G['State'], G['Exports']>
  public get _infusedSetter() {
    if (this._set) return this._set
    const setState: any = (settable: any, meta?: any) =>
      this.setState(settable, meta)

    return (this._set = Object.assign(setState, this.exports))
  }

  /**
   * A standard atom's value can be one of:
   *
   * - A raw value
   * - A Zedux store
   * - A function that returns a raw value
   * - A function that returns a Zedux store
   * - A function that returns an AtomApi
   */
  private _eval(): G['Store'] | G['State'] {
    const { _value } = this.t

    if (typeof _value !== 'function') {
      return _value
    }

    try {
      const val = (
        _value as (
          ...params: G['Params']
        ) => G['Store'] | G['State'] | AtomApi<AtomGenericsToAtomApiGenerics<G>>
      )(...this.p)

      if (!is(val, AtomApi)) return val as G['Store'] | G['State']

      const api = (this.api = val as AtomApi<AtomGenericsToAtomApiGenerics<G>>)

      // Exports can only be set on initial evaluation
      if (this.l === 'Initializing' && api.exports) {
        this.exports = api.exports
      }

      // if api.value is a promise, we ignore api.promise
      if (typeof (api.value as unknown as Promise<any>)?.then === 'function') {
        return this._setPromise(api.value as unknown as Promise<any>, true)
      } else if (api.promise) {
        this._setPromise(api.promise)
      }

      return api.value as G['Store'] | G['State']
    } catch (err) {
      console.error(
        `Zedux: Error while evaluating atom "${this.t.key}" with params:`,
        this.p,
        err
      )

      throw err
    }
  }

  private _handleStateChange(
    newState: G['State'],
    oldState: G['State'] | undefined,
    action: ActionChain
  ) {
    const reason = { n: newState, o: oldState, r: this.w, s: this }
    this.v = newState
    zi.u(reason)

    if (this.e.C.change) zi.i(this.e, reason)

    // run the scheduler synchronously after any atom instance state update
    if (action.meta !== zeduxTypes.batch) {
      this.e._scheduler.flush()
    }
  }

  private _setPromise(promise: Promise<any>, isStateUpdater?: boolean) {
    const currentState = this.store?.getState()
    if (promise === this.promise) return currentState

    this.promise = promise as G['Promise']

    // since we're the first to chain off the returned promise, we don't need to
    // track the chained promise - it will run first, before React suspense's
    // `.then` on the thrown promise, for example
    promise
      .then(data => {
        if (this.promise !== promise) return

        this._promiseStatus = 'success'
        if (!isStateUpdater) return

        this.store.setState(
          getSuccessPromiseState(data) as unknown as G['State']
        )
      })
      .catch(error => {
        if (this.promise !== promise) return

        this._promiseStatus = 'error'
        this._promiseError = error
        if (!isStateUpdater) return

        this.store.setState(
          getErrorPromiseState(error) as unknown as G['State']
        )
      })

    const state: PromiseState<any> = getInitialPromiseState(currentState?.data)
    this._promiseStatus = state.status

    zi.a({ s: this, t: PromiseChange })

    return state as unknown as G['State']
  }
}
