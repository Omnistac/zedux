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
  Ecosystem,
  PromiseState,
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

  public _isEvaluating = false
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
    this.I?.forEach(injector => {
      if (injector.t !== 'effect') {
        nonEffectInjectors.push(injector)
        return
      }
      injector.c?.()
    })
    nonEffectInjectors.forEach(injector => {
      injector.c?.()
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
  public get(): G['State'] {
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
    this.N = []
    this._isEvaluating = true
    const prevNode = zi.s(this)

    try {
      const newFactoryResult = this._eval()

      if (this.l === zi.I) {
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
      this.N.forEach(injector => {
        injector.c?.()
      })

      zi.d(prevNode)

      throw err
    } finally {
      this._isEvaluating = false

      // even if evaluation errored, we need to update observers if the store's
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

    // store the new injectors
    if (this.N) {
      this.I = this.N
      this.N = undefined
    }

    if (this.l !== zi.I) {
      // let this.i flush updates after status is set to Active
      zi.f(prevNode)
    }
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
      if (this.l === zi.I && api.exports) {
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
        `Zedux: Error while evaluating atom "${this.id}" with params:`,
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
      this.e.syncScheduler.flush()
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

        this.promiseStatus = 'success'
        if (!isStateUpdater) return

        this.store.setState(
          getSuccessPromiseState(data) as unknown as G['State']
        )
      })
      .catch(error => {
        if (this.promise !== promise) return

        this.promiseStatus = 'error'
        this.promiseError = error
        if (!isStateUpdater) return

        this.store.setState(
          getErrorPromiseState(error) as unknown as G['State']
        )
      })

    const state: PromiseState<any> = getInitialPromiseState(currentState?.data)
    this.promiseStatus = state.status

    zi.a({ s: this, t: PromiseChange })

    return state as unknown as G['State']
  }
}
