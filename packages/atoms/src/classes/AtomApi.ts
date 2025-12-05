import {
  AtomInstanceTtl,
  AtomApiGenerics,
  Prettify,
  ExportsConfig,
} from '@zedux/atoms/types/index'
import { INITIALIZING, is, prefix } from '@zedux/atoms/utils/general'
import { getEvaluationContext } from '../utils/evaluationContext'
import { AtomInstance } from './instances/AtomInstance'

const wrapExports = <T extends Record<string, any>>(
  exports: T,
  config?: ExportsConfig
): T => {
  const instance = getEvaluationContext().n

  // wrap normal functions in `batch` and, if needed, `withScope` calls. Only do
  // this when `api()` is called during initial atom evaluation.
  return config?.wrap !== false && instance && instance.l === INITIALIZING
    ? Object.entries(exports).reduce((obj, [key, val]) => {
        let maybeWrappedVal = val

        if (
          typeof val === 'function' &&
          // don't wrap functions with static properties
          !Object.keys(val).length &&
          // don't wrap classes
          (!val.prototype ||
            Object.getOwnPropertyDescriptor(val, 'prototype')!.writable)
        ) {
          const wrappedFn = (...args: any[]) => {
            let fn = (instance as AtomInstance<any>).api?.exports[key] ?? val

            if (fn === wrappedFn) fn = val

            return instance.e.batch(() =>
              instance.V
                ? instance.e.withScope(instance.V, () => fn(...args))
                : fn(...args)
            )
          }

          Object.defineProperty(wrappedFn, 'name', { value: val.name })
          maybeWrappedVal = wrappedFn
        }

        ;(obj as Record<string, any>)[key] = maybeWrappedVal

        return obj
      }, {} as T)
    : exports
}

export class AtomApi<G extends AtomApiGenerics> {
  public static $$typeof = Symbol.for(`${prefix}/AtomApi`)

  public exports?: G['Exports']
  public promise: G['Promise']
  public signal: G['Signal']
  public ttl?: AtomInstanceTtl | (() => AtomInstanceTtl)
  public value: G['State'] | G['Signal']

  constructor(value: AtomApi<G> | G['Signal'] | G['State']) {
    this.promise = undefined as G['Promise']
    this.value = value as G['Signal'] | G['State']
    this.signal = (value?.izn ? value : undefined) as G['Signal']

    if (is(value, AtomApi)) {
      Object.assign(this, value as AtomApi<G>)
    }
  }

  public addExports<NewExports extends Record<string, any>>(
    exports: NewExports,
    config?: ExportsConfig
  ): AtomApi<
    Prettify<
      Omit<G, 'Exports'> & {
        Exports: (G['Exports'] extends Record<string, never>
          ? unknown
          : G['Exports']) &
          NewExports
      }
    >
  > {
    const newExports = wrapExports(exports, config)

    if (!this.exports) this.exports = newExports as any
    else this.exports = { ...this.exports, ...newExports }

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
    exports: NewExports,
    config?: ExportsConfig
  ): AtomApi<Prettify<Omit<G, 'Exports'> & { Exports: NewExports }>> {
    ;(
      this as unknown as AtomApi<Omit<G, 'Exports'> & { Exports: NewExports }>
    ).exports = wrapExports(exports, config)

    return this as unknown as AtomApi<
      Omit<G, 'Exports'> & { Exports: NewExports }
    > // for chaining
  }

  public setPromise(): AtomApi<Omit<G, 'Promise'> & { Promise: undefined }>

  public setPromise<P extends Promise<any> | undefined>(
    promise: P
  ): AtomApi<Omit<G, 'Promise'> & { Promise: P }>

  public setPromise<P extends Promise<any> | undefined>(
    promise?: P
  ): AtomApi<Prettify<Omit<G, 'Promise'> & { Promise: P }>> {
    this.promise = promise as unknown as G['Promise']

    return this as unknown as AtomApi<Omit<G, 'Promise'> & { Promise: P }> // for chaining
  }

  public setTtl(ttl: AtomInstanceTtl | (() => AtomInstanceTtl)): AtomApi<G> {
    this.ttl = ttl

    return this as AtomApi<G> // for chaining
  }
}
