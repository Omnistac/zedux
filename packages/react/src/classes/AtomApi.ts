import { is, Store } from '@zedux/core'
import { AtomInstanceTtl, AtomApiPromise } from '@zedux/react/types'
import { prefix } from '@zedux/react/utils/general'

export class AtomApi<
  State,
  Exports extends Record<string, any>,
  StoreType extends Store<State> | undefined,
  PromiseType extends AtomApiPromise
> {
  public static $$typeof = Symbol.for(`${prefix}/AtomApi`)

  public exports?: Exports
  public promise: PromiseType
  public store: StoreType
  public ttl?: AtomInstanceTtl | (() => AtomInstanceTtl)
  public value: State | StoreType

  constructor(
    value: AtomApi<State, Exports, StoreType, PromiseType> | StoreType | State,
    public readonly wrap = true
  ) {
    this.promise = undefined as PromiseType
    this.value = value as StoreType | State
    this.store = (is(value, Store) ? value : undefined) as StoreType

    if (is(value, AtomApi)) {
      Object.assign(
        this,
        value as AtomApi<State, Exports, StoreType, PromiseType>
      )
    }
  }

  public addExports<NewExports extends Record<string, any>>(
    exports: NewExports
  ): AtomApi<State, Exports & NewExports, StoreType, PromiseType> {
    if (!this.exports) this.exports = exports as any
    else this.exports = { ...this.exports, ...exports }

    return this as AtomApi<State, Exports & NewExports, StoreType, PromiseType>
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
}
