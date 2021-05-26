import { ActionChain, Settable } from '@zedux/core'
import {
  AtomInstanceTtl,
  AtomValue,
  DispatchInterceptor,
  SetStateInterceptor,
} from '@zedux/react/types'

export class AtomApi<State, Exports extends Record<string, any>> {
  public dispatchInterceptors?: DispatchInterceptor<State>[]
  public exports?: Exports
  public setStateInterceptors?: SetStateInterceptor<State>[]
  public promise?: Promise<any>
  public ttl?: AtomInstanceTtl | (() => AtomInstanceTtl)
  public value: AtomValue<State>

  constructor(value: AtomValue<State> | AtomApi<State, Exports>) {
    if (value instanceof AtomApi) {
      this.dispatchInterceptors = value.dispatchInterceptors
      this.exports = value.exports
      this.setStateInterceptors = value.setStateInterceptors
      this.promise = value.promise
      this.ttl = value.ttl
      this.value = value.value
    } else {
      this.value = value
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
