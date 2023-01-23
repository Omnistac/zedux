import {
  AtomSelectorConfig,
  AtomSelectorOrConfig,
  Cleanup,
  DependentEdge,
  EdgeFlag,
  EvaluationReason,
  Selectable,
} from '../types'
import { is, JobType } from '../utils'
import { pluginActions } from '../utils/plugin-actions'
import { Ecosystem } from './Ecosystem'

const defaultResultsComparator = (a: any, b: any) => a === b

export class AtomSelectorCache<T = any, Args extends any[] = any[]> {
  public static $$typeof = Symbol.for('@@react/zedux/SelectorCache')
  public isDestroyed?: true
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
 * instances of a class - they'll often be freestanding or even inline
 * functions. This class handles all the logic that AtomSelectors would handle
 * themselves if they were classes - creation, cache management, and
 * destruction.
 */
export class SelectorCache {
  /**
   * Map selectorKey+params keyHash strings to the cached params and result for
   * the selector
   */
  public _caches: Record<string, AtomSelectorCache<any, any>> = {}

  /**
   * Map selectors (or selector config objects) to a base selectorKey that can
   * be used to predictably create selectorKey+params keyHashes to look up the
   * cache in `this._caches`
   */
  public _refBaseKeys = new WeakMap<AtomSelectorOrConfig<any, any>, string>()

  constructor(private readonly ecosystem: Ecosystem) {}

  public addDependent(
    cache: AtomSelectorCache<any, any>,
    {
      callback,
      operation = 'addDependent',
    }: {
      callback?: DependentEdge['callback']
      operation?: string
    } = {}
  ): Cleanup {
    const id = this.ecosystem._idGenerator.generateNodeId()
    this.ecosystem._graph.addEdge(
      id,
      cache.cacheKey,
      operation,
      EdgeFlag.Explicit | EdgeFlag.External,
      callback
    )

    return () => this.ecosystem._graph.removeEdge(id, cache.cacheKey)
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
    const cacheKey = is(selectable, AtomSelectorCache)
      ? (selectable as AtomSelectorCache).cacheKey
      : this.getCacheKey(
          selectable as AtomSelectorOrConfig<T, Args>,
          args as Args
        )

    const cache = is(selectable, AtomSelectorCache)
      ? (selectable as AtomSelectorCache<T, Args>)
      : this._caches[cacheKey]

    if (!cache) return

    const node = this.ecosystem._graph.nodes[cacheKey]

    if (!force && Object.keys(node?.dependents || {}).length) return

    this._destroySelector(cacheKey)
  }

  public getCache<T = any, Args extends [] = []>(
    selectable: Selectable<T, Args>
  ): AtomSelectorCache<T, Args>

  public getCache<T = any, Args extends any[] = []>(
    selectable: Selectable<T, Args>,
    args: Args
  ): AtomSelectorCache<T, Args>

  /**
   * Get the cached args and result for the given AtomSelector (or
   * AtomSelectorConfig). Runs the selector, sets up the graph, and caches the
   * initial value if this selector hasn't been cached before.
   */
  public getCache<T = any, Args extends any[] = []>(
    selectable: Selectable<T, Args> | AtomSelectorCache<T, Args>,
    args: Args = ([] as unknown) as Args
  ) {
    if (is(selectable, AtomSelectorCache)) {
      return selectable
    }

    const selectorOrConfig = selectable as AtomSelectorOrConfig<T, Args>
    const cacheKey = this.getCacheKey(selectorOrConfig, args as Args)
    let cache = this._caches[cacheKey] as AtomSelectorCache<T, Args>

    if (cache) return cache

    // create the cache; it doesn't exist yet
    cache = new AtomSelectorCache(cacheKey, selectorOrConfig, args)
    this._caches[cacheKey] = cache as AtomSelectorCache<any, any[]>
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
          this.ecosystem.complexSelectorParams
        )}`
      : baseKey
  }

  /**
   * Get the string key we would ideally use as the cacheKey of the given
   * AtomSelector function or AtomSelectorConfig object - doesn't necessarily
   * mean we end up caching using this key.
   */
  public getIdealCacheKey(
    selectorOrConfig: AtomSelectorOrConfig<any, any>
  ): string | undefined {
    const idealKey =
      selectorOrConfig.name ||
      (selectorOrConfig as AtomSelectorConfig).selector?.name

    // 'selector' is too generic (it's the key in AtomSelectorConfig objects)
    return (idealKey !== 'selector' && idealKey) || undefined
  }

  /**
   * Get an object of all currently-cached AtomSelectors.
   *
   * Pass a selector reference or string to filter by caches whose cacheKey
   * weakly matches the passed selector name.
   */
  public inspectCaches(selectableOrName?: Selectable<any, any> | string) {
    const hash: Record<string, AtomSelectorCache> = {}
    const filterKey =
      !selectableOrName || typeof selectableOrName === 'string'
        ? selectableOrName
        : is(selectableOrName, AtomSelectorCache)
        ? (selectableOrName as AtomSelectorCache).cacheKey
        : this.getBaseKey(
            selectableOrName as AtomSelectorOrConfig<any, any>,
            true
          ) || this.getIdealCacheKey(selectableOrName as AtomSelectorOrConfig)

    Object.values(this._caches)
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
  public inspectCacheValues(selectableOrName?: Selectable<any, any> | string) {
    const hash = this.inspectCaches(selectableOrName)

    // We just created the object. Just mutate it.
    Object.keys(hash).forEach(cacheKey => {
      hash[cacheKey] = hash[cacheKey].result
    })

    return hash
  }

  public invalidateCache<T = any, Args extends [] = []>(
    selectable: Selectable<T, Args>
  ): void

  public invalidateCache<T = any, Args extends any[] = []>(
    selectable: Selectable<T, Args>,
    args: Args,
    flushScheduler?: boolean
  ): void

  /**
   * Tell Zedux the data for the given selector + args combo is stale - the
   * AtomSelector needs to be rerun.
   *
   * Zedux uses this internally. AtomSelectors usually subscribe to anything
   * that should make them rerun. You shouldn't need to call this yourself.
   */
  public invalidateCache(selectable: Selectable<any, any[]>, args?: any[]) {
    const cache = this.weakGetCache(selectable, args as any[])
    if (!cache) return

    this._scheduleEvaluation(
      cache.cacheKey,
      {
        operation: 'invalidateCache',
        type: 'cache invalidated',
        sourceType: 'External',
      },
      0,
      false
    )

    this.ecosystem._scheduler.flush()
  }

  /**
   * Get the cache for the given selector. Don't create it if it doesn't exist,
   * just return undefined.
   */
  public weakGetCache<T = any, Args extends [] = []>(
    selectable: Selectable<T, Args>
  ): AtomSelectorCache<T, Args> | undefined

  public weakGetCache<T = any, Args extends any[] = []>(
    selectable: Selectable<T, Args>,
    args: Args
  ): AtomSelectorCache<T, Args> | undefined

  public weakGetCache<T = any, Args extends any[] = []>(
    selectable: Selectable<T, Args>,
    args?: Args
  ) {
    if (is(selectable, AtomSelectorCache)) {
      return selectable as AtomSelectorCache
    }

    const cacheKey = this.getCacheKey(
      selectable as AtomSelectorOrConfig<T, Args>,
      args as Args,
      true
    )
    if (!cacheKey) return

    return this._caches[cacheKey]
  }

  /**
   * Destroy all cached selectors. Should probably only be used internally.
   * Prefer `ecosystem.reset()`.
   */
  public wipe() {
    Object.keys(this._caches).forEach(cacheKey => {
      this._destroySelector(cacheKey)
    })

    this._refBaseKeys = new WeakMap()
  }

  /**
   * Should only be used internally. Removes the selector from the cache and
   * the graph
   */
  public _destroySelector(cacheKey: string) {
    const cache = this._caches[cacheKey]

    if (!cache) return // shouldn't happen

    if (cache.nextEvaluationReasons.length && cache.task) {
      this.ecosystem._scheduler.unscheduleJob(cache.task)
    }

    this.ecosystem._graph.removeDependencies(cacheKey)
    this.ecosystem._graph.removeNode(cacheKey)
    delete this._caches[cacheKey]
    cache.isDestroyed = true
    this._refBaseKeys.delete(cache.selectorRef)
  }

  /**
   * Should only be used internally
   */
  public _scheduleEvaluation(
    cacheKey: string,
    reason: EvaluationReason,
    flags: number,
    shouldSetTimeout?: boolean
  ) {
    const cache = this._caches[cacheKey]

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

    this.ecosystem._scheduler.scheduleJob(
      {
        flags,
        keyHash: cacheKey,
        task,
        type: JobType.EvaluateNode,
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
   * Get a base key that can be used to generate consistent cacheKeys for the
   * given selector
   */
  private getBaseKey(
    selectorOrConfig: AtomSelectorOrConfig<any, any[]>,
    weak?: boolean
  ) {
    const existingId = this._refBaseKeys.get(selectorOrConfig)

    if (existingId || weak) return existingId

    const idealKey = this.getIdealCacheKey(selectorOrConfig)
    const prefixedKey = `@@selector-${idealKey}`
    const keyExists = this._caches[prefixedKey]

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
    const cache = this._caches[cacheKey] as AtomSelectorCache<T, Args>
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
              selectorCache: cache as AtomSelectorCache<any, any[]>,
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
