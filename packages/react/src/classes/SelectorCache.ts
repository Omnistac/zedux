import { is } from '@zedux/core'
import {
  AtomSelectorConfig,
  AtomSelectorOrConfig,
  Cleanup,
  DependentCallback,
  EvaluationReason,
  Selectable,
} from '../types'
import { Explicit, External, prefix } from '../utils'
import { pluginActions } from '../utils/plugin-actions'
import { Ecosystem } from './Ecosystem'

const defaultResultsComparator = (a: any, b: any) => a === b

export class SelectorCacheItem<T = any, Args extends any[] = any[]> {
  public static $$typeof = Symbol.for(`${prefix}/SelectorCache`)
  public isDestroyed?: boolean
  public nextEvaluationReasons: EvaluationReason[] = []
  public prevEvaluationReasons?: EvaluationReason[]
  public result?: T
  public task?: () => void

  constructor(
    public cacheKey: string,
    public selectorRef: AtomSelectorOrConfig<T, Args>,
    public args?: Args
  ) {}
}

/**
 * Since AtomSelectors are meant to feel lightweight, they don't have to be
 * instances of a class - they'll often be standalone or even inline
 * functions. This class handles all the logic that AtomSelectors would handle
 * themselves if they were classes - creation, cache management, and
 * destruction.
 */
export class SelectorCache {
  /**
   * Map selectorKey+params keyHash strings to the cached params and result for
   * the selector
   */
  public _items: Record<string, SelectorCacheItem<any, any>> = {}

  /**
   * Map selectors (or selector config objects) to a base selectorKey that can
   * be used to predictably create selectorKey+params keyHashes to look up the
   * cache in `this._items`
   */
  public _refBaseKeys = new WeakMap<AtomSelectorOrConfig<any, any>, string>()

  constructor(private readonly ecosystem: Ecosystem) {}

  public addDependent(
    cacheItem: SelectorCacheItem<any, any>,
    {
      callback,
      operation = 'addDependent',
    }: {
      callback?: DependentCallback
      operation?: string
    } = {}
  ): Cleanup {
    const id = this.ecosystem._idGenerator.generateNodeId()
    this.ecosystem._graph.addEdge(
      id,
      cacheItem.cacheKey,
      operation,
      Explicit | External,
      callback
    )

    return () => this.ecosystem._graph.removeEdge(id, cacheItem.cacheKey)
  }

  public destroyCache<T = any, Args extends [] = []>(
    selectable: Selectable<T, Args>
  ): void

  public destroyCache<T = any, Args extends any[] = []>(
    selectable: Selectable<T, Args>,
    args: Args,
    force?: boolean
  ): void

  /**
   * Destroys the cache for the given selector + args combo (if it exists).
   *
   * Destruction bails out by default if the selector's ref count is > 0. Pass
   * `true` as the 3rd param to force destruction.
   */
  public destroyCache<T = any, Args extends any[] = []>(
    selectable: Selectable<T, Args>,
    args?: Args,
    force?: boolean
  ) {
    const cacheKey = is(selectable, SelectorCacheItem)
      ? (selectable as SelectorCacheItem).cacheKey
      : this.getCacheKey(
          selectable as AtomSelectorOrConfig<T, Args>,
          args as Args
        )

    const cache = is(selectable, SelectorCacheItem)
      ? (selectable as SelectorCacheItem<T, Args>)
      : this._items[cacheKey]

    if (!cache) return

    const node = this.ecosystem._graph.nodes[cacheKey]

    if (!force && Object.keys(node?.dependents || {}).length) return

    this._destroySelector(cacheKey)
  }

  public getCache<T = any, Args extends [] = []>(
    selectable: Selectable<T, Args>
  ): SelectorCacheItem<T, Args>

  public getCache<T = any, Args extends any[] = []>(
    selectable: Selectable<T, Args>,
    args: Args
  ): SelectorCacheItem<T, Args>

  /**
   * Get the cached args and result for the given AtomSelector (or
   * AtomSelectorConfig). Runs the selector, sets up the graph, and caches the
   * initial value if this selector hasn't been cached before.
   */
  public getCache<T = any, Args extends any[] = []>(
    selectable: Selectable<T, Args> | SelectorCacheItem<T, Args>,
    args: Args = ([] as unknown) as Args
  ) {
    if (is(selectable, SelectorCacheItem)) {
      return selectable
    }

    const selectorOrConfig = selectable as AtomSelectorOrConfig<T, Args>
    const cacheKey = this.getCacheKey(selectorOrConfig, args as Args)
    let cache = this._items[cacheKey] as SelectorCacheItem<T, Args>

    if (cache) return cache

    // create the cache; it doesn't exist yet
    cache = new SelectorCacheItem(cacheKey, selectorOrConfig, args)
    this._items[cacheKey] = cache as SelectorCacheItem<any, any[]>
    this.ecosystem._graph.addNode(cacheKey, true)

    this.runSelector(cacheKey, args as Args, true)

    return cache
  }

  public getCacheKey<T = any, Args extends [] = []>(
    selectorOrConfig: AtomSelectorOrConfig<T, Args>
  ): string

  public getCacheKey<T = any, Args extends any[] = []>(
    selectorOrConfig: AtomSelectorOrConfig<T, Args>,
    args: Args
  ): string

  public getCacheKey<T = any, Args extends any[] = []>(
    selectorOrConfig: AtomSelectorOrConfig<T, Args>,
    args: Args,
    weak: true
  ): string | undefined

  /**
   * Get the fully qualified key hash for the given selector+params combo
   */
  public getCacheKey(
    selectorOrConfig: AtomSelectorOrConfig<any, any[]>,
    args?: any[],
    weak?: boolean
  ) {
    const baseKey = this.getBaseKey(selectorOrConfig, weak)

    return args?.length
      ? `${baseKey}-${this.ecosystem._idGenerator.hashParams(
          args,
          this.ecosystem.complexParams
        )}`
      : baseKey
  }

  /**
   * Get an object of all currently-cached AtomSelectors.
   *
   * Pass a selector reference or string to filter by caches whose cacheKey
   * weakly matches the passed selector name.
   */
  public inspectItems(selectableOrName?: Selectable<any, any> | string) {
    const hash: Record<string, SelectorCacheItem> = {}
    const filterKey =
      !selectableOrName || typeof selectableOrName === 'string'
        ? selectableOrName
        : is(selectableOrName, SelectorCacheItem)
        ? (selectableOrName as SelectorCacheItem).cacheKey
        : this.getBaseKey(
            selectableOrName as AtomSelectorOrConfig<any, any>,
            true
          ) || this._getIdealCacheKey(selectableOrName as AtomSelectorOrConfig)

    Object.values(this._items)
      .sort((a, b) => a.cacheKey.localeCompare(b.cacheKey))
      .forEach(instance => {
        if (filterKey && !instance.cacheKey.includes(filterKey)) {
          return
        }

        hash[instance.cacheKey] = instance
      })

    return hash
  }

  /**
   * Get an object mapping all cacheKeys in this selectorCache to their current
   * values.
   *
   * Pass an atom or atom key string to only return instances whose keyHash
   * weakly matches the passed key.
   */
  public inspectItemValues(selectableOrName?: Selectable<any, any> | string) {
    const hash = this.inspectItems(selectableOrName)

    // We just created the object. Just mutate it.
    Object.keys(hash).forEach(cacheKey => {
      hash[cacheKey] = hash[cacheKey].result
    })

    return hash
  }

  /**
   * Get the cache for the given selector. Don't create it if it doesn't exist,
   * just return undefined.
   */
  public weakGetCache<T = any, Args extends [] = []>(
    selectable: Selectable<T, Args>
  ): SelectorCacheItem<T, Args> | undefined

  public weakGetCache<T = any, Args extends any[] = []>(
    selectable: Selectable<T, Args>,
    args: Args
  ): SelectorCacheItem<T, Args> | undefined

  public weakGetCache<T = any, Args extends any[] = []>(
    selectable: Selectable<T, Args>,
    args?: Args
  ) {
    if (is(selectable, SelectorCacheItem)) {
      return selectable as SelectorCacheItem
    }

    const cacheKey = this.getCacheKey(
      selectable as AtomSelectorOrConfig<T, Args>,
      args as Args,
      true
    )
    if (!cacheKey) return

    return this._items[cacheKey]
  }

  /**
   * Should only be used internally. Removes the selector from the cache and
   * the graph
   */
  public _destroySelector(cacheKey: string) {
    const cache = this._items[cacheKey]

    if (!cache) return // shouldn't happen

    if (cache.nextEvaluationReasons.length && cache.task) {
      this.ecosystem._scheduler.unschedule(cache.task)
    }

    this.ecosystem._graph.removeDependencies(cacheKey)
    this.ecosystem._graph.removeNode(cacheKey)
    delete this._items[cacheKey]
    cache.isDestroyed = true
    this._refBaseKeys.delete(cache.selectorRef)
  }

  /**
   * Get the string key we would ideally use as the cacheKey of the given
   * AtomSelector function or AtomSelectorConfig object - doesn't necessarily
   * mean we end up caching using this key.
   */
  public _getIdealCacheKey(
    selectorOrConfig: AtomSelectorOrConfig<any, any>
  ): string | undefined {
    const idealKey =
      selectorOrConfig.name ||
      (selectorOrConfig as AtomSelectorConfig).selector?.name

    // 'selector' is too generic (it's the key in AtomSelectorConfig objects)
    return (idealKey !== 'selector' && idealKey) || undefined
  }

  /**
   * Should only be used internally
   */
  public _scheduleEvaluation(
    cacheKey: string,
    reason: EvaluationReason,
    shouldSetTimeout?: boolean
  ) {
    const cache = this._items[cacheKey]

    // TODO: Any calls in this case probably indicate a memory leak on the
    // user's part. Notify them.
    if (!cache) return

    cache.nextEvaluationReasons.push(reason)

    if (cache.nextEvaluationReasons.length > 1) return // job already scheduled

    const task = () => {
      cache.task = undefined
      this.runSelector(cacheKey, cache.args as any[])
    }
    cache.task = task

    this.ecosystem._scheduler.schedule(
      {
        keyHash: cacheKey,
        task,
        type: 2, // EvaluateGraphNode (2)
      },
      shouldSetTimeout
    )
  }

  /**
   * Should only be used internally
   */
  public _swapRefs(
    oldRef: AtomSelectorOrConfig<any, any[]>,
    newRef: AtomSelectorOrConfig<any, any[]>,
    args: any[]
  ) {
    const existingCache = this.weakGetCache(oldRef, args)
    const baseKey = this._refBaseKeys.get(oldRef)

    if (!existingCache || !baseKey) return

    this._refBaseKeys.set(newRef, baseKey)
    existingCache.selectorRef = newRef
    this.runSelector(existingCache.cacheKey, args)
  }

  /**
   * Destroy all cached selectors. Should probably only be used internally.
   * Prefer `ecosystem.reset()`.
   */
  public _wipe() {
    Object.keys(this._items).forEach(cacheKey => {
      this._destroySelector(cacheKey)
    })

    this._refBaseKeys = new WeakMap()
  }

  /**
   * Get a base key that can be used to generate consistent cacheKeys for the
   * given selector
   */
  private getBaseKey(
    selectorOrConfig: AtomSelectorOrConfig<any, any[]>,
    weak?: boolean
  ) {
    const existingId = this._refBaseKeys.get(selectorOrConfig)

    if (existingId || weak) return existingId

    const idealKey = this._getIdealCacheKey(selectorOrConfig)
    const prefixedKey = `@@selector-${idealKey}`
    const keyExists = this._items[prefixedKey]

    // if the ideal key is taken, generate a new hash prefixed with the ideal key
    const key =
      !idealKey || keyExists
        ? this.ecosystem._idGenerator.generateAtomSelectorId(idealKey)
        : prefixedKey

    this._refBaseKeys.set(selectorOrConfig, key)

    return key
  }

  /**
   * Run an AtomSelector and, depending on the selector's resultsComparator,
   * update its cached result. Updates the graph efficiently (using
   * `.bufferUpdates()`)
   */
  private runSelector<T = any, Args extends any[] = []>(
    cacheKey: string,
    args: Args,
    isInitializing?: boolean
  ) {
    this.ecosystem._graph.bufferUpdates(cacheKey)
    const cache = this._items[cacheKey] as SelectorCacheItem<T, Args>
    this.ecosystem._evaluationStack.start(cache)
    const selector =
      typeof cache.selectorRef === 'function'
        ? cache.selectorRef
        : cache.selectorRef.selector

    const resultsComparator =
      (typeof cache.selectorRef !== 'function' &&
        cache.selectorRef.resultsComparator) ||
      defaultResultsComparator

    try {
      const result = selector(
        this.ecosystem._evaluationStack.atomGetters,
        ...args
      )

      if (!isInitializing && !resultsComparator(result, cache.result as T)) {
        this.ecosystem._graph.scheduleDependents(
          cacheKey,
          cache.nextEvaluationReasons,
          result,
          cache.result
        )

        if (this.ecosystem._mods.stateChanged) {
          this.ecosystem.modBus.dispatch(
            pluginActions.stateChanged({
              newState: result,
              oldState: cache.result,
              reasons: cache.nextEvaluationReasons,
              selectorCache: cache as SelectorCacheItem<any, any[]>,
            })
          )
        }

        cache.result = result
      } else if (isInitializing) {
        cache.result = result
      }
    } catch (err) {
      this.ecosystem._graph.destroyBuffer()
      console.error(
        `Zedux encountered an error while running AtomSelector with key "${cacheKey}":`,
        err
      )

      throw err
    } finally {
      this.ecosystem._evaluationStack.finish()
      cache.prevEvaluationReasons = cache.nextEvaluationReasons
      cache.nextEvaluationReasons = []
    }

    this.ecosystem._graph.flushUpdates()
  }
}
