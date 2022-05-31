import {
  AtomGetters,
  AtomParamsType,
  AtomSelectorConfig,
  AtomSelectorOrConfig,
  EdgeFlag,
  EvaluationReason,
  EvaluationTargetType,
  EvaluationType,
  GraphEdgeInfo,
} from '../types'
import { AtomSelectorCache, JobType } from '../utils'
import { AtomBase } from './atoms/AtomBase'
import { Ecosystem } from './Ecosystem'
import { ZeduxPlugin } from './ZeduxPlugin'

const defaultResultsComparator = (a: any, b: any) => a === b

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
  public caches: Record<string, AtomSelectorCache<any, any[]>> = {}

  /**
   * Map selectors (or selector config objects) to a base selectorKey that can
   * be used to predictably create selectorKey+params keyHashes to look up the
   * cache in `this._selectorCache`
   */
  public refBaseKeys = new WeakMap<AtomSelectorOrConfig<any, any[]>, string>()

  /**
   * A stack of AtomSelectors that are currently evaluating - innermost selector
   * (the one that's actually currently evaluating) at the end of the array
   */
  private evaluatingStack: string[] = []

  private atomGetters: AtomGetters

  constructor(private readonly ecosystem: Ecosystem) {
    const get: AtomGetters['get'] = ((atomOrInstance, params) => {
      const instance = ecosystem.getInstance(atomOrInstance, params)

      // when called outside AtomSelector evaluation, get() is just an alias for
      // ecosystem.get()
      if (!this.evaluatingStack.length) return instance.store.getState()

      // if get is called during evaluation, track the required atom instances so
      // we can add graph edges for them
      ecosystem._graph.addEdge(
        this.evaluatingStack[this.evaluatingStack.length - 1],
        instance.keyHash,
        'get',
        0
      )

      return instance.store.getState()
    }) as AtomGetters['get']

    const getInstance: AtomGetters['getInstance'] = <
      A extends AtomBase<any, [...any], any>
    >(
      atomOrInstance: A,
      params?: AtomParamsType<A>,
      edgeInfo?: GraphEdgeInfo
    ) => {
      const instance = ecosystem.getInstance(
        atomOrInstance,
        params as AtomParamsType<A>
      )

      // when called outside AtomSelector evaluation, getInstance() is just an alias
      // for ecosystem.getInstance()
      if (!this.evaluatingStack.length) return instance

      // if getInstance is called during evaluation, track the required atom
      // instances so we can add graph edges for them
      ecosystem._graph.addEdge(
        this.evaluatingStack[this.evaluatingStack.length - 1],
        instance.keyHash,
        edgeInfo?.[1] || 'getInstance',
        edgeInfo?.[0] ?? EdgeFlag.Static
      )

      return instance
    }

    const select: AtomGetters['select'] = <T = any, Args extends any[] = []>(
      selectorOrConfig: AtomSelectorOrConfig<T, Args>,
      ...args: Args
    ) => {
      // when called outside AtomSelector evaluation, select() is just an alias for ecosystem.select()
      if (!this.evaluatingStack.length) {
        return ecosystem.select(selectorOrConfig, ...args)
      }

      const cache = this.getCache(selectorOrConfig, args)

      ecosystem._graph.addEdge(
        this.evaluatingStack[this.evaluatingStack.length - 1],
        cache.cacheKey,
        'select',
        0
      )

      return cache.result as T
    }

    this.atomGetters = {
      ecosystem,
      get,
      getInstance,
      select,
    }
  }

  public getCache<T = any, Args extends [] = []>(
    selectorOrConfig: AtomSelectorOrConfig<T, Args>
  ): AtomSelectorCache<T, Args>

  public getCache<T = any, Args extends any[] = []>(
    selectorOrConfig: AtomSelectorOrConfig<T, Args>,
    args: Args
  ): AtomSelectorCache<T, Args>

  /**
   * Get the cached args and result for the given AtomSelector (or
   * AtomSelectorConfig). Runs the selector, sets up the graph, and caches the
   * initial value if this selector hasn't been cached before.
   */
  public getCache<T = any, Args extends any[] = []>(
    selectorOrConfig: AtomSelectorOrConfig<T, Args>,
    args?: Args
  ) {
    const cacheKey = this.getCacheKey(selectorOrConfig, args as Args)
    let cache = this.caches[cacheKey] as AtomSelectorCache<T, Args>

    if (cache) return cache

    cache = {
      args,
      cacheKey,
      nextEvaluationReasons: [],
      selectorRef: selectorOrConfig,
    }
    this.caches[cacheKey] = cache as AtomSelectorCache<any, any[]>
    this.ecosystem._graph.addNode(cacheKey, true)

    this.runSelector(cacheKey, args as Args)

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
          this.ecosystem.allowComplexSelectorParams
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

    // 'selector' is too generic - it's the key in AtomSelectorConfig objects
    return idealKey === 'selector' ? undefined : idealKey
  }

  public invalidate<T = any, Args extends [] = []>(
    selectorOrConfig: AtomSelectorOrConfig<T, Args>
  ): void

  public invalidate<T = any, Args extends any[] = []>(
    selectorOrConfig: AtomSelectorOrConfig<T, Args>,
    args: Args
  ): void

  /**
   * Tell Zedux the data for the given selector + params is stale - the
   * AtomSelector needs to be rerun.
   *
   * Zedux uses this internally. AtomSelectors usually subscribe to anything
   * that should make them rerun. You shouldn't need to call this yourself.
   */
  public invalidate(
    selectorOrConfig: AtomSelectorOrConfig<any, any[]>,
    args?: any[]
  ) {
    const cache = this.weakGetCache(selectorOrConfig, args as any[])
    if (!cache) return

    this._scheduleEvaluation(
      cache.cacheKey,
      {
        operation: 'invalidate',
        type: EvaluationType.CacheInvalidated,
        targetType: EvaluationTargetType.External,
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
    selectorOrConfig: AtomSelectorOrConfig<T, Args>
  ): AtomSelectorCache<T, Args> | undefined

  public weakGetCache<T = any, Args extends any[] = []>(
    selectorOrConfig: AtomSelectorOrConfig<T, Args>,
    args: Args
  ): AtomSelectorCache<T, Args> | undefined

  public weakGetCache<T = any, Args extends any[] = []>(
    selectorOrConfig: AtomSelectorOrConfig<T, Args>,
    args?: Args
  ) {
    const cacheKey = this.getCacheKey(selectorOrConfig, args as Args, true)
    if (!cacheKey) return

    return this.caches[cacheKey]
  }

  /**
   * Should only be used internally. Removes the selector from the cache and
   * the graph
   */
  public _destroySelector(cacheKey: string) {
    const cache = this.caches[cacheKey]

    if (!cache) return // shouldn't happen

    if (cache.nextEvaluationReasons.length && cache.task) {
      this.ecosystem._scheduler.unscheduleJob(cache.task)
    }

    this.ecosystem._graph.removeDependencies(cacheKey)
    this.ecosystem._graph.removeNode(cacheKey)
    delete this.caches[cacheKey]
    this.refBaseKeys.delete(cache.selectorRef)
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
    const cache = this.caches[cacheKey]

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
   * Get a base key that can be used to generate consistent cacheKeys for the
   * given selector
   */
  private getBaseKey(
    selectorOrConfig: AtomSelectorOrConfig<any, any[]>,
    weak?: boolean
  ) {
    const existingId = this.refBaseKeys.get(selectorOrConfig)

    if (existingId || weak) return existingId

    const idealKey = this.getIdealCacheKey(selectorOrConfig)
    const keyExists = !idealKey || this.caches[idealKey]

    // if the ideal key is taken, generate a new hash prefixed with the ideal key
    const key = keyExists
      ? this.ecosystem._idGenerator.generateAtomSelectorId(idealKey)
      : idealKey

    this.refBaseKeys.set(selectorOrConfig, key)

    return key
  }

  /**
   * Run an AtomSelector and, depending on the selector's resultsComparator,
   * update its cached result. Updates the graph efficiently (using
   * `.bufferUpdates()`)
   */
  private runSelector<T = any, Args extends any[] = []>(
    cacheKey: string,
    args: Args
  ) {
    this.evaluatingStack.push(cacheKey)
    this.ecosystem._graph.bufferUpdates(cacheKey)
    const cache = this.caches[cacheKey] as AtomSelectorCache<T, Args>
    const selector =
      typeof cache.selectorRef === 'function'
        ? cache.selectorRef
        : cache.selectorRef.selector

    const resultsComparator =
      (typeof cache.selectorRef !== 'function' &&
        cache.selectorRef.resultsComparator) ||
      defaultResultsComparator

    try {
      const result = selector(this.atomGetters, ...args)

      if (
        (typeof cache.result === 'undefined' && result !== cache.result) ||
        !resultsComparator(result, cache.result)
      ) {
        this.ecosystem._graph.scheduleDependents(
          cacheKey,
          cache.nextEvaluationReasons,
          result,
          cache.result
        )

        if (this.ecosystem.mods.stateChanged) {
          this.ecosystem.modsMessageBus.dispatch(
            ZeduxPlugin.actions.stateChanged({
              newState: result,
              oldState: cache.result,
              reasons: cache.nextEvaluationReasons,
              selectorCache: cache as AtomSelectorCache<any, any[]>,
            })
          )
        }

        cache.result = result
      }
    } catch (err) {
      this.ecosystem._graph.destroyBuffer()
      console.error(
        `Zedux encountered an error while running AtomSelector with key "${cacheKey}":`
      )

      throw err
    } finally {
      this.evaluatingStack.pop()
      cache.prevEvaluationReasons = cache.nextEvaluationReasons
      cache.nextEvaluationReasons = []
    }

    this.ecosystem._graph.flushUpdates()
  }
}
