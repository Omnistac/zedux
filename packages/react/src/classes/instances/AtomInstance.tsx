import { ActionChain, Settable, Store } from '@zedux/core'
import { ActiveState, AtomValue } from '@zedux/react/types'
import { AtomApi } from '../AtomApi'
import { StandardAtomBase } from '../atoms/StandardAtomBase'
import { Ecosystem } from '../Ecosystem'
import { AtomInstanceBase } from './AtomInstanceBase'

export class AtomInstance<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends AtomInstanceBase<
  State,
  Params,
  StandardAtomBase<State, Params, Exports>
> {
  public _destructionTimeout?: ReturnType<typeof setTimeout>
  public _isPromiseResolved
  public api?: AtomApi<State, Exports>
  public exports: Exports
  public promise?: Promise<any>
  public store: Store<State>

  constructor(
    ecosystem: Ecosystem,
    atom: StandardAtomBase<State, Params, Exports>,
    keyHash: string,
    params: Params
  ) {
    super(ecosystem, atom, keyHash, params)

    // standard atom instances expose this (so consumers can use a
    // non-underscore-prefixed property)
    this.store = this._stateStore

    // lol
    this.exports = (this as any).exports || undefined
    this._isPromiseResolved = (this as any)._isPromiseResolved ?? true
  }

  /**
   * A standard atom's value can be one of:
   *
   * - A raw value
   * - A Zedux store
   * - A function that returns a raw value
   * - A function that returns a Zedux store
   * - A function that returns an AtomApi (TODO: this)
   */
  public _evaluate() {
    const { _value } = this.atom

    if (_value instanceof AtomApi) {
      this.api = _value
      return _value.value
    }

    if (typeof _value !== 'function') {
      return _value
    }

    try {
      const val = (_value as (
        ...params: Params
      ) => AtomValue<State> | AtomApi<State, Exports>)(...this.params)

      if (val instanceof AtomApi) {
        this.api = val

        // Exports can only be set on initial evaluation
        if (this._activeState === ActiveState.Initializing) {
          this.exports = val.exports as Exports

          if (val.promise) {
            this.promise = val.promise
            this._isPromiseResolved = false

            val.promise.then(() => {
              this._isPromiseResolved = true
            })
          }
        }

        return val.value
      }

      return val
    } catch (err) {
      console.error(
        `Zedux - Error while instantiating atom "${this.atom.key}" with params:`,
        this.params,
        err
      )

      throw err
    }
  }

  /**
   * When a standard atom instance's refCount hits 0 and a ttl is set, we set a
   * timeout to destroy this atom instance.
   */
  public _scheduleDestruction() {
    const { ttl } = this.atom

    // By default, atoms live forever. Also the atom may already be scheduled
    // for destruction or destroyed
    if (ttl == null || ttl === -1 || this._activeState !== ActiveState.Active) {
      return
    }

    if (ttl === 0) {
      return this._destroy()
    }

    // schedule destruction (if ttl is > 0)
    if (typeof ttl !== 'number') return

    const timeoutId = setTimeout(() => this._destroy(), ttl)

    // TODO: dispatch an action over stateStore for these mutations
    this._destructionTimeout = timeoutId
    this._activeState = ActiveState.Destroying
  }

  public dispatch = (action: ActionChain) => {
    if (this.api?.dispatchInterceptors?.length) {
      return this.api._interceptDispatch(action, (newAction: ActionChain) =>
        this._stateStore.dispatch(newAction)
      )
    }

    return this._stateStore.dispatch(action)
  }

  public setState = (settable: Settable<State>) => {
    if (this.api?.setStateInterceptors?.length) {
      return this.api._interceptSetState(
        settable,
        (newSettable: Settable<State>) => this._stateStore.setState(newSettable)
      )
    }

    return this._stateStore.setState(settable)
  }
}
