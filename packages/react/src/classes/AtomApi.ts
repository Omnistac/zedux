import {
  ActionChain,
  isZeduxStore,
  Settable,
  Store,
  StoreStateType,
} from '@zedux/core'
import {
  AtomInstanceTtl,
  AtomValue,
  DispatchInterceptor,
  SetStateInterceptor,
} from '@zedux/react/types'
import { is } from '@zedux/react/utils/general'

export class AtomApi<State, Exports extends Record<string, any>> {
  public static $$typeof = Symbol.for('@@react/zedux/AtomApi')

  public dispatchInterceptors?: DispatchInterceptor<State>[]
  public exports?: Exports
  public promise?: Promise<any>
  public setStateInterceptors?: SetStateInterceptor<State>[]
  public ttl?: AtomInstanceTtl | (() => AtomInstanceTtl)
  public value: AtomValue<State>

  constructor(value: AtomValue<State> | AtomApi<State, Exports>) {
    if (is(value, AtomApi)) {
      const asAtomApi = value as AtomApi<State, Exports>
      this.dispatchInterceptors = asAtomApi.dispatchInterceptors
      this.exports = asAtomApi.exports
      this.setStateInterceptors = asAtomApi.setStateInterceptors
      this.promise = asAtomApi.promise
      this.ttl = asAtomApi.ttl
      this.value = asAtomApi.value
    } else {
      this.value = value as AtomValue<State>
    }
  }

  public addExports<NewExports extends Record<string, any>>(
    exports: NewExports
  ): AtomApi<State, Exports & NewExports> {
    if (!this.exports) this.exports = exports as any
    else this.exports = { ...this.exports, ...exports }

    return this as AtomApi<State, Exports & NewExports>
  }

  public addDispatchInterceptor(interceptor: DispatchInterceptor<State>) {
    if (!this.dispatchInterceptors) {
      this.dispatchInterceptors = []
    }

    this.dispatchInterceptors.push(interceptor)

    return this // for chaining
  }

  public addSetStateInterceptor(interceptor: SetStateInterceptor<State>) {
    if (!this.setStateInterceptors) {
      this.setStateInterceptors = []
    }

    this.setStateInterceptors.push(interceptor)

    return this // for chaining
  }

  public setExports<NewExports extends Record<string, any>>(
    exports: NewExports
  ): AtomApi<State, NewExports> {
    ;(this as AtomApi<State, NewExports>).exports = exports

    return this as AtomApi<State, NewExports> // for chaining
  }

  public setPromise(promise: Promise<any>) {
    this.promise = promise

    return this // for chaining
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
  Exports extends Record<string, any>
> extends AtomApi<StoreStateType<S>, Exports> {
  public static $$typeof = Symbol.for('@@react/zedux/StoreAtomApi')
  public readonly store: S

  constructor(storeOrApi: S | StoreAtomApi<S, Exports>) {
    super(storeOrApi)
    this.store = isZeduxStore(storeOrApi)
      ? (storeOrApi as S)
      : (storeOrApi as StoreAtomApi<S, Exports>).store
  }

  public addExports<NewExports extends Record<string, any>>(
    exports: NewExports
  ): StoreAtomApi<S, Exports & NewExports> {
    return super.addExports(exports) as StoreAtomApi<S, Exports & NewExports>
  }

  public setExports<NewExports extends Record<string, any>>(
    exports: NewExports
  ): StoreAtomApi<S, NewExports> {
    return super.setExports(exports) as StoreAtomApi<S, NewExports>
  }
}
