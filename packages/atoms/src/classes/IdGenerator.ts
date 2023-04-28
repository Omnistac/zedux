import { is, isPlainObject } from '@zedux/core'
import { AtomInstanceBase } from './instances/AtomInstanceBase'

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
   * This method and `IdGenerator#now()` are the only methods in Zedux that
   * produce random values.
   *
   * Override these when testing to create reproducible graphs/dehydrations that
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
   * Generate a graph node key for a React component
   */
  public generateReactComponentId() {
    if (!DEV) return this.generateId('rc')

    const { stack } = new Error()

    if (!stack) return ''

    const lines = stack
      .split('\n')
      .slice(2)
      .map(line =>
        line
          .trim()
          // V8/JavaScriptCore:
          .replace('at ', '')
          .replace(/ \(.*\)/, '')
          // SpiderMonkey:
          .replace(/@.*/, '')
      )

    const componentName = lines
      .find(line => {
        if (!/\w/.test(line[0])) return false

        const identifiers = line.split('.')
        const fn = identifiers[identifiers.length - 1]
        return fn[0]?.toUpperCase() === fn[0]
      })
      ?.split(' ')[0]

    return this.generateId(componentName || 'UnknownComponent')
  }

  /**
   * Turn an array of anything into a predictable string. If any item is an atom
   * instance, it will be serialized as the instance's id. If
   * acceptComplexParams is true, map class instances and functions to a
   * consistent id for the reference.
   *
   * Note that recursive objects are not supported - they would add way too much
   * overhead here and are really just unnecessary.
   */
  public hashParams(params: any[], acceptComplexParams?: boolean): string {
    return JSON.stringify(params, (_, param) => {
      if (is(param, AtomInstanceBase)) return param.id
      if (!param) return param
      if (!isPlainObject(param)) {
        if (!acceptComplexParams || Array.isArray(param)) return param
        if (typeof param === 'function') return this.cacheFn(param)
        if (typeof param?.constructor === 'function') {
          return this.cacheClass(param)
        }

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

  /**
   * Generate a timestamp. Pass true to make it a high res timestamp if possible
   *
   * This method and `IdGenerator#generateId()` are the only methods in Zedux
   * that produce random values.
   *
   * Override these when testing to create reproducible graphs/dehydrations that
   * can be used easily in snapshot testing. See our setup in the Zedux repo at
   * `<repo root>/packages/react/test/utils/ecosystem.ts` for an example.
   */
  public now(highRes?: boolean) {
    return highRes && typeof performance !== 'undefined'
      ? performance.now()
      : Date.now()
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
