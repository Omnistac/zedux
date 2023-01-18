import { isPlainObject } from '@zedux/core/utils/general'
import { is } from '../utils'
import { AtomInstanceBase } from './instances/AtomInstanceBase'

/**
 * When using SSR, only `generateNodeId` should be allowed to run. It is okay
 * for `generateAtomSelectorId` to run, but auto-id'd selectors won't be
 * hydratable on the client (usually fine for inline selectors). Ecosystem ids
 * must be set manually
 *
 * To prevent Zedux from auto-id'ing AtomSelectors, use a shared function
 * reference. When using AtomSelectorConfig objects, make sure the object
 * reference itself is shared. In both cases, the function must have a unique
 * name.
 *
 * ```ts
 * // examples that will be auto-id'd:
 * useAtomSelector(({ get }) => get(myAtom)) // inline function ref can't be shared and has no name
 * const mySelector = { // this object reference can be shared...
 *   selector: ({ get }) => get(myAtom) // ...but the function has a generic name
 * }
 *
 * // examples where ids will be generated predictably based on params:
 * const mySelector = ({ get }) => get(myAtom) // function has a name and ref can be shared
 * const mySelector = { // this ref can be shared...
 *   selector: function mySelector({ get }) { // ...and the function has a name
 *     return get(myAtom)
 *   }
 * }
 * const mySelector = { // this ref can be shared...
 *   name: 'mySelector', // ...and we set the `name` config option
 *   selector: ({ get }) => get(myAtom)
 * }
 * ```
 */
export class IdGenerator {
  public idCounter = 0

  /**
   * Cache function and class instance references that get passed as params to
   * atoms or AtomSelectors. Map them to a unique, serializable id. Use a
   * WeakMap so we don't hold on to anything here
   */
  public weakCache = new WeakMap<any, string>()

  public generateAtomSelectorId(name = '') {
    if (!name) {
      name = DEV ? 'unknownSelector' : 'as'
    }

    return this.generateId(`@@selector-${name}`)
  }

  public generateEcosystemId() {
    return this.generateId('es')
  }

  public generateId = (prefix: string) =>
    `${prefix}-${++this.idCounter}${Math.random().toString(16).slice(2, 14)}`

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
          .replace('at ', '')
          .replace(/ \(.*\)/, '')
      )

    const componentName = lines
      .find(line => {
        if (!/\w/.test(line[0])) return false

        const identifiers = line.split('.')
        const fn = identifiers[identifiers.length - 1]
        return fn[0].toUpperCase() === fn[0]
      })
      ?.split(' ')[0]

    return this.generateId(componentName || 'UnknownComponent')
  }

  /**
   * Turn an array of anything into a predictable string. If any item is an atom
   * instance, it will be serialized as the instance's keyHash. If
   * acceptComplexParams is true, map class instances and functions to a
   * consistent id for the reference.
   *
   * Note that recursive objects are not supported - they would add way too much
   * overhead here and are really just unnecessary.
   */
  public hashParams(params: any[], acceptComplexParams?: boolean): string {
    return JSON.stringify(params, (_, param) => {
      if (is(param, AtomInstanceBase)) return param.keyHash
      if (!param) return param
      if (!isPlainObject(param)) {
        if (!acceptComplexParams || Array.isArray(param)) return param
        if (typeof param === 'function') return this.cacheFn(param)
        if (typeof param?.constructor === 'function') {
          return this.cacheClass(param)
        }

        return param // let engine try resolve it or throw the error
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
