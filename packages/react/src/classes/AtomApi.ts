import { ActionChain, isZeduxStore, Settable, Store } from '@zedux/core'
import {
  AtomInstanceTtl,
  AtomApiPromise,
  DispatchInterceptor,
  SetStateInterceptor,
} from '@zedux/react/types'
import { is } from '@zedux/react/utils/general'

export class AtomApi<
  State,
  Exports extends Record<string, any>,
  StoreType extends Store<State> | undefined,
  PromiseType extends AtomApiPromise
> {
  public static $$typeof = Symbol.for('@@react/zedux/AtomApi')

  public dispatchInterceptors?: DispatchInterceptor<State>[]
  public exports?: Exports
  public promise: PromiseType
  public setStateInterceptors?: SetStateInterceptor<State>[]
  public store: StoreType
  public ttl?: AtomInstanceTtl | (() => AtomInstanceTtl)
  public value: State | StoreType

  constructor(
    value: AtomApi<State, Exports, StoreType, PromiseType> | StoreType | State
  ) {
    this.promise = undefined as PromiseType
    this.value = value as StoreType | State
    this.store = (isZeduxStore(value) ? value : undefined) as StoreType

    if (is(value, AtomApi)) {
      Object.assign(
        this,
        value as AtomApi<State, Exports, StoreType, PromiseType>
      )
    }
  }

  public addDispatchInterceptor(interceptor: DispatchInterceptor<State>) {
    if (!this.dispatchInterceptors) {
      this.dispatchInterceptors = []
    }

    this.dispatchInterceptors.push(interceptor)

    return this as AtomApi<State, Exports, StoreType, PromiseType> // for chaining
  }

  public addExports<NewExports extends Record<string, any>>(
    exports: NewExports
  ): AtomApi<State, Exports & NewExports, StoreType, PromiseType> {
    if (!this.exports) this.exports = exports as any
    else this.exports = { ...this.exports, ...exports }

    return this as AtomApi<State, Exports & NewExports, StoreType, PromiseType>
  }

  public addSetStateInterceptor(interceptor: SetStateInterceptor<State>) {
    if (!this.setStateInterceptors) {
      this.setStateInterceptors = []
    }

    this.setStateInterceptors.push(interceptor)

    return this as AtomApi<State, Exports, StoreType, PromiseType> // for chaining
  }

  public setExports<NewExports extends Record<string, any>>(
    exports: NewExports
  ): AtomApi<State, NewExports, StoreType, PromiseType> {
    ;((this as unknown) as AtomApi<
      State,
      NewExports,
      StoreType,
      PromiseType
    >).exports = exports

    return (this as unknown) as AtomApi<
      State,
      NewExports,
      StoreType,
      PromiseType
    > // for chaining
  }

  public setPromise<T>(
    promise: Promise<T>
  ): AtomApi<State, Exports, StoreType, Promise<T>> {
    this.promise = (promise as unknown) as PromiseType

    return this as AtomApi<State, Exports, StoreType, Promise<T>> // for chaining
  }

  public setTtl(ttl: AtomInstanceTtl | (() => AtomInstanceTtl)) {
    this.ttl = ttl

    return this // for chaining
  }

  public _interceptDispatch(
    action: ActionChain,
    next: (action: ActionChain) => State
  ) {
    const intercept = this.dispatchInterceptors?.reduceRight(
      (nextInterceptor: (action: ActionChain) => State, interceptor) => (
        newAction: ActionChain
      ) => interceptor(newAction, nextInterceptor),
      next
    )

    return (intercept || next)(action)
  }

  public _interceptSetState(
    settable: Settable<State>,
    next: (settable: Settable<State>) => State
  ) {
    const intercept = this.setStateInterceptors?.reduceRight(
      (nextInterceptor: (settable: Settable<State>) => State, interceptor) => (
        newSettable: Settable<State>
      ) => interceptor(newSettable, nextInterceptor),
      next
    )

    return (intercept || next)(settable)
  }
}
