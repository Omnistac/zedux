import { AtomInstanceTtl, Prettify } from '@zedux/atoms'
import { is, Store } from '@zedux/core'
import { prefix } from './atoms-port'
import { StoreAtomApiGenerics } from './types'

export class StoreAtomApi<G extends StoreAtomApiGenerics> {
  public static $$typeof = Symbol.for(`${prefix}/AtomApi`)

  public exports?: G['Exports']
  public promise: G['Promise']
  public store: G['Store']
  public signal: undefined
  public ttl?: AtomInstanceTtl | (() => AtomInstanceTtl)
  public value: G['State'] | G['Store']

  constructor(value: StoreAtomApi<G> | G['Store'] | G['State']) {
    this.promise = undefined as G['Promise']
    this.value = value as G['Store'] | G['State']
    this.store = (is(value, Store) ? value : undefined) as G['Store']

    if (is(value, StoreAtomApi)) {
      Object.assign(this, value as StoreAtomApi<G>)
    }
  }

  public addExports<NewExports extends Record<string, any>>(
    exports: NewExports
  ): StoreAtomApi<
    Prettify<
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

    return this as StoreAtomApi<
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
  ): StoreAtomApi<Prettify<Omit<G, 'Exports'> & { Exports: NewExports }>> {
    ;(
      this as unknown as StoreAtomApi<
        Omit<G, 'Exports'> & { Exports: NewExports }
      >
    ).exports = exports

    return this as unknown as StoreAtomApi<
      Omit<G, 'Exports'> & { Exports: NewExports }
    > // for chaining
  }

  public setPromise(): StoreAtomApi<Omit<G, 'Promise'> & { Promise: undefined }>

  public setPromise<P extends Promise<any> | undefined>(
    promise: P
  ): StoreAtomApi<Omit<G, 'Promise'> & { Promise: P }>

  public setPromise<P extends Promise<any> | undefined>(
    promise?: P
  ): StoreAtomApi<Prettify<Omit<G, 'Promise'> & { Promise: P }>> {
    this.promise = promise as unknown as G['Promise']

    return this as unknown as StoreAtomApi<Omit<G, 'Promise'> & { Promise: P }> // for chaining
  }

  public setTtl(ttl: AtomInstanceTtl | (() => AtomInstanceTtl)) {
    this.ttl = ttl

    return this // for chaining
  }
}
