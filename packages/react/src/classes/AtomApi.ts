import {
  ActionChain,
  isZeduxStore,
  Settable,
  Store,
  StoreStateType,
} from '@zedux/core'
import {
  AtomInstanceTtl,
  AtomApiPromise,
  AtomValue,
  DispatchInterceptor,
  SetStateInterceptor,
} from '@zedux/react/types'
import { is } from '@zedux/react/utils/general'

export class AtomApi<
  State,
  Exports extends Record<string, any>,
  PromiseType extends AtomApiPromise
> {
  public static $$typeof = Symbol.for('@@react/zedux/AtomApi')

  public dispatchInterceptors?: DispatchInterceptor<State>[]
  public exports?: Exports
  public promise: PromiseType
  public setStateInterceptors?: SetStateInterceptor<State>[]
  public ttl?: AtomInstanceTtl | (() => AtomInstanceTtl)
  public value: AtomValue<State>

  constructor(value: AtomValue<State> | AtomApi<State, Exports, PromiseType>) {
    this.promise = undefined as PromiseType
    this.value = value as AtomValue<State>

    if (is(value, AtomApi)) {
      const asAtomApi = value as AtomApi<State, Exports, PromiseType>
      Object.assign(this, asAtomApi)
    }
  }

  public addDispatchInterceptor(interceptor: DispatchInterceptor<State>) {
    if (!this.dispatchInterceptors) {
      this.dispatchInterceptors = []
    }

    this.dispatchInterceptors.push(interceptor)

    return this as AtomApi<State, Exports, PromiseType> // for chaining
  }

  public addExports<NewExports extends Record<string, any>>(
    exports: NewExports
  ): AtomApi<State, Exports & NewExports, PromiseType> {
    if (!this.exports) this.exports = exports as any
    else this.exports = { ...this.exports, ...exports }

    return this as AtomApi<State, Exports & NewExports, PromiseType>
  }

  public addSetStateInterceptor(interceptor: SetStateInterceptor<State>) {
    if (!this.setStateInterceptors) {
      this.setStateInterceptors = []
    }

    this.setStateInterceptors.push(interceptor)

    return this as AtomApi<State, Exports, PromiseType> // for chaining
  }

  public setExports<NewExports extends Record<string, any>>(
    exports: NewExports
  ): AtomApi<State, NewExports, PromiseType> {
    ;((this as unknown) as AtomApi<
      State,
      NewExports,
      PromiseType
    >).exports = exports

    return (this as unknown) as AtomApi<State, NewExports, PromiseType> // for chaining
  }

  public setPromise<T>(
    promise: Promise<T>
  ): AtomApi<State, Exports, Promise<T>> {
    this.promise = (promise as unknown) as PromiseType

    return this as AtomApi<State, Exports, Promise<T>> // for chaining
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

export class StoreAtomApi<
  S extends Store,
  Exports extends Record<string, any>,
  PromiseType extends AtomApiPromise
> extends AtomApi<StoreStateType<S>, Exports, PromiseType> {
  public static $$typeof = Symbol.for('@@react/zedux/StoreAtomApi')
  public readonly store: S

  constructor(storeOrApi: S | StoreAtomApi<S, Exports, PromiseType>) {
    super(storeOrApi)
    this.store = isZeduxStore(storeOrApi)
      ? (storeOrApi as S)
      : (storeOrApi as StoreAtomApi<S, Exports, PromiseType>).store
  }

  public addDispatchInterceptor(
    interceptor: DispatchInterceptor<StoreStateType<S>>
  ): StoreAtomApi<S, Exports, PromiseType> {
    return super.addDispatchInterceptor(interceptor) as StoreAtomApi<
      S,
      Exports,
      PromiseType
    >
  }

  public addExports<NewExports extends Record<string, any>>(
    exports: NewExports
  ): StoreAtomApi<S, Exports & NewExports, PromiseType> {
    return super.addExports(exports) as StoreAtomApi<
      S,
      Exports & NewExports,
      PromiseType
    >
  }

  public addSetStateInterceptor(
    interceptor: SetStateInterceptor<StoreStateType<S>>
  ): StoreAtomApi<S, Exports, PromiseType> {
    return super.addSetStateInterceptor(interceptor) as StoreAtomApi<
      S,
      Exports,
      PromiseType
    >
  }

  public setExports<NewExports extends Record<string, any>>(
    exports: NewExports
  ): StoreAtomApi<S, NewExports, PromiseType> {
    return super.setExports(exports) as StoreAtomApi<S, NewExports, PromiseType>
  }

  public setPromise<T>(
    promise: Promise<T>
  ): StoreAtomApi<S, Exports, Promise<T>> {
    return super.setPromise(promise) as StoreAtomApi<S, Exports, Promise<T>>
  }
}
