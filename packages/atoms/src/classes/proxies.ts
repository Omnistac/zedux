import { RecursivePartial } from '@zedux/core'
import { Transaction, MutatableTypes } from '../types/index'

export type ParentProxy<State> = {
  t: Transaction[]
  u: (val: State, key?: string) => void
}

const addTransaction = (
  proxyWrapper: ProxyWrapper<any>,
  transaction: Transaction
) => {
  proxyWrapper.t.push(transaction)

  // once a change happens in a child proxy, tell the parent that it does need
  // to update the child's key. Technically, since we mutate the object
  // reference, this only needs to happen once. We could optimize this by adding
  // a `hasPropagated` property to ProxyWrapper and flipping it on in
  // `ProxyWrapper.u`pdateParent. Not sure if it's necessary
  proxyWrapper.c.u(proxyWrapper.v, proxyWrapper.k?.at(-1))
}

/**
 * There are several array mutation operations that are not at all worth
 * supporting in the current transaction model because the resulting transaction
 * list would be as big (or bigger) than the entire state array.
 *
 * So it's more efficient for us to not code handlers for those and tell the
 * user to use `.set` to manually clone state and perform that operation
 * themselves. There are usually better solutions that can still use `.mutate`
 * e.g. manually doing an insertion sort and using `.mutate` to update specific
 * indices rather than calling `arr.sort()`.
 *
 * TODO: We can technically support these operations by expanding the
 * transactions API to include special array `sort`/`reverse` (also set `clear`)
 * types with unique properties, kind of like we do with the `i`nsert type -
 * @see Transaction
 */
const notSupported = () => {
  throw new Error(
    `This operation is not supported. Use \`.set\` instead of \`.mutate\``
  )
}

const withPath = (key: PropertyKey, path?: PropertyKey[]) =>
  path ? [...path, key] : key

export abstract class ProxyWrapper<State extends MutatableTypes>
  implements ParentProxy<State>, ProxyHandler<State>
{
  /**
   * `p`roxy - the actual proxy this class is wrapping
   */
  p = new Proxy(this.v, this)

  constructor(
    /**
     * `v`alue - the already-cloned state that the proxy is proxying
     */
    public v: State,

    /**
     * `c`reator - the parent proxy wrapper or top-level proxy-wrapper-like
     * object that created this proxy wrapper.
     */
    public c: ParentProxy<State>,

    /**
     * `k`eyPath - the property path to this potentially indefinitely-nested
     * object inside the root state object of the signal. `undefined` if this is
     * the top-level object.
     */
    public k?: string[],

    /**
     * `t`ransactions - the ordered list of every transaction tracked by the
     * top-level `signal.mutate` call. Every ProxyWrapper node mutates this
     * directly.
     */
    public t = c.t
  ) {}

  /**
   * `a`ddTransaction - add an `add` or `update` transaction to the list
   */
  public a(key: PropertyKey, v?: any) {
    addTransaction(this, { k: withPath(key, this.k), v })
  }

  /**
   * `d`eletePropertyImpl - handle the `delete` operator. Native JS objects
   * should be the only data type to override this. Everything else should let
   * this error throw.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public d(state: State, key: PropertyKey) {
    notSupported()
  }

  public deleteProperty(state: State, key: PropertyKey) {
    this.d(state, key)

    return true
  }

  /**
   * All data types should override this. The proxy class instances themselves
   * are passed as the second argument to `new Proxy`
   */
  public abstract get(state: State, key: PropertyKey): any

  /**
   * `i`nsertTransaction - add an `i`nsert transaction to the list
   */
  public i(key: PropertyKey, v: any) {
    addTransaction(this, { k: withPath(key, this.k), v, t: 'i' })
  }

  /**
   * `r`emoveTransaction - add a `d`elete transaction to the list
   */
  public r(key: PropertyKey) {
    addTransaction(this, { k: withPath(key, this.k), t: 'd' })
  }

  /**
   * `s`etImpl - handle the `=` assignment operator. Only native JS objects and
   * arrays should override this.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public s(state: State, key: PropertyKey, val: any) {
    notSupported()
  }

  public set(state: State, key: PropertyKey, val: any) {
    this.s(state, key, val)

    return true
  }

  /**
   * `u`pdateParent - propagates a change to this proxy wrapper from a nested
   * ("child") proxy wrapper and recursively up the proxy wrapper tree.
   *
   * `key` is optional to maintain compatibility with the top-level
   * `ParentProxy` "ProxyWrapper-like" object initially passed to
   * `recursivelyProxy`
   */
  public u(val: any, key?: string) {
    ;(this.v as Record<string, any>)[key!] = val

    // only array and object types have nested proxies. And this method can only
    // be called by a nested proxy, which will always pass `key` to this method,
    // so don't bother checking for undefined
    this.c.u(this.v, this.k?.at(-1))
  }
}

export class ArrayProxy<State extends any[]> extends ProxyWrapper<State> {
  constructor(rawState: State, creator: ParentProxy<State>, path?: string[]) {
    super([...rawState] as State, creator, path)
  }

  get(state: any[], key: PropertyKey): any {
    const methods = {
      pop: () => {
        this.r(state.length - 1)

        return state.pop()
      },
      push: (...items: any[]) => {
        for (let i = 0; i < items.length; i++) {
          this.a(state.length + i, items[i])
        }

        return state.push(...items)
      },
      reverse: notSupported,
      shift: () => {
        this.r(0)

        return state.shift()
      },
      sort: notSupported,
      splice: (index: number, deleteCount: number, ...items: any[]) => {
        const splice = state.splice(index, deleteCount, ...items)

        for (let i = 0; i < splice.length; i++) {
          this.r(index + i)
        }

        for (let i = 0; i < items.length; i++) {
          this.i(index + i, items[i])
        }

        return splice
      },
      unshift: (...items: any[]) => {
        for (let i = 0; i < items.length; i++) {
          this.i(i, items[i])
        }

        return state.unshift(...items)
      },
    }

    return (
      methods[key as keyof typeof methods] ??
      (typeof key === 'symbol' || isNaN(+key)
        ? state[key as keyof typeof state]
        : maybeRecursivelyProxy(
            state[key as keyof typeof state],
            this,
            this.k ? [...this.k, key] : [key]
          ))
    )
  }

  s(state: State, key: PropertyKey, val: any) {
    this.a(key, val)
    state[key as keyof State] = val
  }
}

export class ObjectProxy<
  State extends Record<PropertyKey, any>
> extends ProxyWrapper<State> {
  constructor(rawState: State, creator: ParentProxy<State>, path?: string[]) {
    super({ ...rawState }, creator, path)
  }

  d(state: State, key: PropertyKey) {
    this.r(key)
    delete state[key]
  }

  get<K extends PropertyKey>(state: State, key: K): State[K] {
    return maybeRecursivelyProxy(
      state[key],
      this,
      this.k ? [...this.k, key] : [key]
    )
  }

  s(state: State, key: PropertyKey, val: any) {
    this.a(key, val)
    state[key as keyof State] = val
  }
}

export class SetProxy<State extends Set<any>> extends ProxyWrapper<any> {
  constructor(rawState: State, creator: ParentProxy<State>, path?: string[]) {
    super(new Set(rawState), creator, path)
  }

  get(state: State, key: PropertyKey): any {
    // TODO: we should probably add `.forEach` (and recursively proxy items) at
    // least
    const methods = {
      add: (val: any) => {
        this.a(val)
        return state.add(val)
      },
      clear: () => {
        // TODO: We could optimize this to be a unique `t: "c"` (type: clear)
        // operation
        state.forEach(item => this.r(item))
        return state.clear()
      },
      delete: (val: any) => {
        state.has(val) && this.r(val)
        return state.delete(val)
      },
    }

    const method = methods[key as keyof typeof methods]

    if (method) return method

    const property = state[key as keyof typeof state]

    return typeof property === 'function'
      ? (property as (...args: any[]) => any).bind(state)
      : property
  }
}

const maybeRecursivelyProxy = <State extends MutatableTypes>(
  ...args: Parameters<typeof recursivelyProxy<State>>
) => {
  const result = recursivelyProxy<State>(...args)

  return result instanceof ProxyWrapper ? result.p : result
}

/**
 * Handles the object shorthand of `signal.mutate`, translating every field in
 * the passed `update` object into a proxied mutation on the state object
 *
 * Only supports JS objects (and therefore arrays too).
 *
 * @param state should be a proxy e.g. `recursivelyProxy(...).p`
 * @param update the indefinitely-nested fields we're modifying
 */
export const recursivelyMutate = <State extends Record<string, any>>(
  state: State,
  update: RecursivePartial<State>
) => {
  for (const [key, val] of Object.entries(update)) {
    if (val && typeof val === 'object') {
      if (state[key] && typeof state[key] === 'object') {
        recursivelyMutate(state[key], val)
      } else {
        ;(state as any)[key] = val
      }

      continue
    }

    // ignore undefined (see https://github.com/Omnistac/zedux/issues/95)
    if (typeof val !== 'undefined') state[key as keyof State] = val
  }
}

export const recursivelyProxy = <State extends MutatableTypes>(
  oldState: State,
  parent: ParentProxy<State>,
  path?: PropertyKey[]
): ProxyWrapper<State> => {
  const isArr = Array.isArray(oldState)
  const isSet = oldState instanceof Set

  if (!isArr && !isSet && (typeof oldState !== 'object' || !oldState)) {
    return oldState // not proxy-able
  }

  const newState = (
    isArr ? [...oldState] : isSet ? new Set(oldState) : { ...oldState }
  ) as State

  // @ts-expect-error ts can't handle this apparently
  return new (isArr ? ArrayProxy : isSet ? SetProxy : ObjectProxy)(
    newState,
    parent,
    path
  )
}
