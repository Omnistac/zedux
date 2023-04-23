import { is, Store } from '@zedux/core'
import {
  AtomInstanceTtl,
  AtomApiGenerics,
  Prettify,
} from '@zedux/atoms/types/index'
import { prefix } from '@zedux/atoms/utils/general'

export class AtomApi<G extends AtomApiGenerics> {
  public static $$typeof = Symbol.for(`${prefix}/AtomApi`)

  public exports?: G['Exports']
  public promise: G['Promise']
  public store: G['Store']
  public ttl?: AtomInstanceTtl | (() => AtomInstanceTtl)
  public value: G['State'] | G['Store']

  constructor(value: AtomApi<G> | G['Store'] | G['State']) {
    this.promise = undefined as G['Promise']
    this.value = value as G['Store'] | G['State']
    this.store = (is(value, Store) ? value : undefined) as G['Store']

    if (is(value, AtomApi)) {
      Object.assign(this, value as AtomApi<G>)
    }
  }

  public addExports<NewExports extends Record<string, any>>(
    exports: NewExports
  ): Prettify<
    AtomApi<
      Omit<G, 'Exports'> & {
        Exports: (G['Exports'] extends Record<string, never>
          ? unknown
          : G['Exports']) &
          NewExports
      }
    >
  > {
    if (!this.exports) this.exports = exports as any
    else this.exports = { ...this.exports, ...exports }

    return this as AtomApi<
      Omit<G, 'Exports'> & {
        Exports: (G['Exports'] extends Record<string, never>
          ? unknown
          : G['Exports']) &
          NewExports
      }
    >
  }

  public setExports<NewExports extends Record<string, any>>(
    exports: NewExports
  ): Prettify<AtomApi<Omit<G, 'Exports'> & { Exports: NewExports }>> {
    ;(
      this as unknown as AtomApi<Omit<G, 'Exports'> & { Exports: NewExports }>
    ).exports = exports

    return this as unknown as AtomApi<
      Omit<G, 'Exports'> & { Exports: NewExports }
    > // for chaining
  }

  public setPromise<T>(
    promise: Promise<T>
  ): Prettify<AtomApi<Omit<G, 'Promise'> & { Promise: Promise<T> }>> {
    this.promise = promise as unknown as G['Promise']

    return this as AtomApi<Omit<G, 'Promise'> & { Promise: Promise<T> }> // for chaining
  }

  public setTtl(ttl: AtomInstanceTtl | (() => AtomInstanceTtl)) {
    this.ttl = ttl

    return this // for chaining
  }
}
