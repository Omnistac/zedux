import { isPlainObject } from '@zedux/core'
import { GraphNode } from './GraphNode'

/**
 * When using SSR, only graph node ids should be generated (via
 * `generateNodeId`). It is okay for AtomSelector ids to be generated during
 * SSR, but id'd selectors won't be hydratable on the client since those ids are
 * not generated predictably (selectors shouldn't be hydrated anyway). Ecosystem
 * ids must be set manually.
 */
export class IdGenerator {
  public idCounter = 0

  /**
   * Cache function and class instance references that get passed as params to
   * atoms or AtomSelectors. Map them to a unique, serializable id. Use a
   * WeakMap so we don't hold on to anything here
   */
  public weakCache = new WeakMap<any, string>()

  /**
   * Generate an id that is guaranteed to be unique in this ecosystem and
   * pretty-much-guaranteed to be unique globally.
   *
   * This method is the only method in Zedux that produces random values.
   *
   * Override this when testing to create reproducible graphs/dehydrations that
   * can be used easily in snapshot testing. See our setup in the Zedux repo at
   * `<repo root>/packages/react/test/utils/ecosystem.ts` for an example.
   */
  public generateId = (prefix: string) =>
    // we can slice from 2 to 12 if needed, but keeping it short for now:
    `${prefix}-${++this.idCounter}${Math.random().toString(36).slice(2, 8)}`

  public generateNodeId() {
    return this.generateId('no')
  }

  /**
   * Turn an array of anything into a predictable string. If any item is an atom
   * instance, it will be serialized as the instance's id. If
   * acceptComplexParams is true, map class instances and functions to a
   * consistent id for the reference.
   *
   * Note that circular object references are not supported - they would add way
   * too much overhead here and are really just unnecessary.
   */
  public hashParams(params: any[], acceptComplexParams?: boolean): string {
    return JSON.stringify(params, (_, param) => {
      if (!param) return param
      if (param.izn) return (param as GraphNode).id
      if (!isPlainObject(param)) {
        if (!acceptComplexParams || Array.isArray(param)) return param
        if (typeof param === 'function') return this.cacheFn(param)
        if (typeof param === 'object') return this.cacheClass(param)

        return param // let engine try to resolve it or throw the error
      }

      return Object.keys(param)
        .sort()
        .reduce((result, key) => {
          result[key] = param[key]
          return result
        }, {} as Record<string, any>)
    })
  }

  private cacheClass(instance: { new (): any }) {
    let id = this.weakCache.get(instance)
    if (id) return id

    id = this.generateId(instance.constructor.name || 'UnknownClass')
    this.weakCache.set(instance, id)

    return id
  }

  private cacheFn(fn: (...args: any[]) => any) {
    let id = this.weakCache.get(fn)
    if (id) return id

    id = this.generateId(fn.name || 'anonFn')
    this.weakCache.set(fn, id)

    return id
  }
}
