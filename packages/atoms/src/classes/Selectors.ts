import { is } from '@zedux/core'
import {
  AtomSelectorConfig,
  AtomSelectorOrConfig,
  Cleanup,
  DependentCallback,
  EvaluationReason,
  Selectable,
} from '../types/index'
import { Explicit, External, prefix } from '../utils/index'
import { pluginActions } from '../utils/plugin-actions'
import { Ecosystem } from './Ecosystem'

const defaultResultsComparator = (a: any, b: any) => a === b

export class SelectorCache<T = any, Args extends any[] = any[]> {
  public static $$typeof = Symbol.for(`${prefix}/SelectorCache`)
  public isDestroyed?: boolean
  public nextReasons: EvaluationReason[] = []
  public prevReasons?: EvaluationReason[]
  public result?: T

  constructor(
    public task: () => void,
    public id: string,
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
export class Selectors {
  /**
   * Map selectorKey + params id strings to the SelectorCache for the selector
   */
  public _items = new Map<string, SelectorCache<any, any[]>>()

  /**
   * Map selectors (or selector config objects) to a base selectorKey that can
   * be used to predictably create selectorKey+params ids to look up the cache
   * in `this._items`
   */
  public _refBaseKeys = new WeakMap<AtomSelectorOrConfig<any, any>, string>()

  constructor(private readonly ecosystem: Ecosystem) {}

  public addDependent(
    cacheItem: SelectorCache<any, any>,
    {
      callback,
      operation = 'addDependent',
    }: {
      callback?: DependentCallback
      operation?: string
    } = {}
  ): Cleanup {
    const { _graph, _idGenerator } = this.ecosystem
    const id = _idGenerator.generateNodeId()

    _graph.addEdge(id, cacheItem.id, operation, Explicit | External, callback)

    return () => _graph.removeEdge(id, cacheItem.id)
  }

  /**
   * Get an object mapping all ids in this selectorCache to their current
   * values.
   *
   * Pass a selector to only return caches of that selector.
   *
   * Pass a partial SelectorCache id string to only return caches whose id
   * contains the passed key (case-insensitive).
   *
   * IMPORTANT: Don't use this for SSR. SelectorCaches are not designed to be
   * shared across environments. Selectors should be simple derivations that
   * will be predictably recreated from rehydrated atom instances.
   *
   * In other words, `ecosystem.dehydrate()` is all you need for SSR. Don't
   * worry about selectors. This method is solely an inspection/debugging util.
   */
  public dehydrate(selectableOrName?: Selectable<any, any> | string) {
    const hash = this.findAll(selectableOrName)

    // We just created the object. Just mutate it.
    Object.keys(hash).forEach(id => {
      hash[id] = hash[id].result
    })

    return hash
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
    const id = is(selectable, SelectorCache)
      ? (selectable as SelectorCache).id
      : this.getCacheId(
          selectable as AtomSelectorOrConfig<T, Args>,
          args as Args
        )

    const cache = is(selectable, SelectorCache)
      ? (selectable as SelectorCache<T, Args>)
      : this._items.get(id)

    if (!cache || cache.isDestroyed) return

    const node = this.ecosystem._graph.nodes.get(id)

    if (force || !node!.refCount) {
      this._destroySelector(id)
    }
  }

  /**
   * Get the cache for the given selector. Return undefined if it doesn't exist
   * yet - don't create it.
   */
  public find<T = any, Args extends [] = []>(
    selectable: Selectable<T, Args>
  ): SelectorCache<T, Args> | undefined

  public find<T = any, Args extends any[] = []>(
    selectable: Selectable<T, Args>,
    args: Args
  ): SelectorCache<T, Args> | undefined

  public find<T = any, Args extends any[] = any[]>(
    selectable: string
  ): SelectorCache<T, Args> | undefined

  public find<T = any, Args extends any[] = []>(
    selectable: Selectable<T, Args> | string,
    args?: Args
  ) {
    if (is(selectable, SelectorCache)) {
      return selectable as SelectorCache
    }

    if (typeof selectable === 'string') {
      return Object.values(this.findAll(selectable))[0]
    }

    const id = this.getCacheId(
      selectable as AtomSelectorOrConfig<T, Args>,
      args as Args,
      true
    )

    return id && this._items.get(id)
  }

  /**
   * Get an object of all currently-cached AtomSelectors.
   *
   * Pass a selector reference or string to filter by caches whose id
   * weakly matches the passed selector name.
   */
  public findAll(selectableOrName: Selectable<any, any> | string = '') {
    const hash: Record<string, SelectorCache> = {}
    const filterKey =
      typeof selectableOrName === 'string'
        ? selectableOrName.toLowerCase()
        : is(selectableOrName, SelectorCache)
        ? (selectableOrName as SelectorCache).id
        : this.getBaseKey(
            selectableOrName as AtomSelectorOrConfig<any, any>,
            true
          ) || this._getIdealCacheId(selectableOrName as AtomSelectorOrConfig)

    Object.values(this._items)
      .sort((a, b) => a.id.localeCompare(b.id))
      .forEach(item => {
        if (!filterKey || item.id.toLowerCase().includes(filterKey)) {
          hash[item.id] = item
        }
      })

    return hash
  }

  public getCache<T = any, Args extends [] = []>(
    selectable: Selectable<T, Args>
  ): SelectorCache<T, Args>

  public getCache<T = any, Args extends any[] = []>(
    selectable: Selectable<T, Args>,
    args: Args
  ): SelectorCache<T, Args>

  /**
   * Get the cached args and result for the given AtomSelector (or
   * AtomSelectorConfig). Runs the selector, sets up the graph, and caches the
   * initial value if this selector hasn't been cached before.
   */
  public getCache<T = any, Args extends any[] = []>(
    selectable: Selectable<T, Args> | SelectorCache<T, Args>,
    args: Args = [] as unknown as Args
  ) {
    if (is(selectable, SelectorCache)) {
      return selectable
    }

    const selectorOrConfig = selectable as AtomSelectorOrConfig<T, Args>
    const id = this.getCacheId(selectorOrConfig, args)
    let cache = this._items.get(id) as SelectorCache<T, Args>

    if (cache) return cache

    // create the cache; it doesn't exist yet
    cache = new SelectorCache(
      () => {
        this.runSelector(cache as SelectorCache, cache.args as any[])
      },
      id,
      selectorOrConfig,
      args
    )

    this._items.set(id, cache as SelectorCache<any, any[]>)
    this.ecosystem._graph.addNode(id, true)

    this.runSelector(cache, args, true)

    return cache
  }

  public getCacheId<T = any, Args extends [] = []>(
    selectorOrConfig: AtomSelectorOrConfig<T, Args>
  ): string

  public getCacheId<T = any, Args extends any[] = []>(
    selectorOrConfig: AtomSelectorOrConfig<T, Args>,
    args: Args
  ): string

  public getCacheId<T = any, Args extends any[] = []>(
    selectorOrConfig: AtomSelectorOrConfig<T, Args>,
    args: Args,
    weak: true
  ): string | undefined

  /**
   * Get the fully qualified id for the given selector+params combo
   */
  public getCacheId(
    selectorOrConfig: AtomSelectorOrConfig<any, any[]>,
    args?: any[],
    weak?: boolean
  ) {
    const { complexParams, _idGenerator } = this.ecosystem
    const paramsHash = args?.length
      ? _idGenerator.hashParams(args, complexParams)
      : ''

    const baseKey = this.getBaseKey(selectorOrConfig, weak)

    return paramsHash ? `${baseKey}-${paramsHash}` : baseKey
  }

  /**
   * Should only be used internally. Removes the selector from the cache and
   * the graph
   */
  public _destroySelector(id: string) {
    const cache = this._items.get(id)

    if (!cache) return // shouldn't happen

    const { _graph, _scheduler, _mods, modBus } = this.ecosystem

    if (cache.nextReasons.length) {
      _scheduler.unschedule(cache.task)
    }

    _graph.removeDependencies(id)
    _graph.removeNode(cache)
    this._items.delete(id)
    cache.isDestroyed = true
    // don't delete the ref from this._refBaseKeys; this selector cache isn't
    // necessarily the only one using it (if the selector takes params). Just
    // let the WeakMap clean itself up.

    if (_mods.statusChanged) {
      modBus.dispatch(
        pluginActions.statusChanged({
          newStatus: 'Destroyed',
          node: cache,
          oldStatus: 'Active',
        })
      )
    }
  }

  /**
   * Get the string key we would ideally use as the id of the given
   * AtomSelector function or AtomSelectorConfig object - doesn't necessarily
   * mean we end up caching using this key.
   */
  public _getIdealCacheId(
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
    id: string,
    reason: EvaluationReason,
    shouldSetTimeout?: boolean
  ) {
    const cache = this._items.get(id) as SelectorCache
    cache.nextReasons.push(reason)

    if (cache.nextReasons.length > 1) return // job already scheduled

    this.ecosystem._scheduler.schedule(
      {
        id: cache.id,
        task: cache.task,
        type: 2, // EvaluateGraphNode (2)
      },
      shouldSetTimeout
    )
  }

  /**
   * Should only be used internally
   */
  public _swapRefs<T, Args extends any[]>(
    oldCache: SelectorCache<T, Args>,
    newRef: AtomSelectorOrConfig<T, Args>,
    args: any[] = []
  ) {
    const baseKey = this._refBaseKeys.get(oldCache.selectorRef)

    if (!baseKey) return

    this._refBaseKeys.set(newRef, baseKey)
    this._refBaseKeys.delete(oldCache.selectorRef)
    oldCache.selectorRef = newRef
    this.runSelector(oldCache as SelectorCache, args, false, true)
  }

  /**
   * Destroy all cached selectors. Should probably only be used internally.
   * Prefer `ecosystem.reset()`.
   */
  public _wipe() {
    Object.keys(this._items).forEach(id => {
      this._destroySelector(id)
    })

    this._refBaseKeys = new WeakMap()
  }

  /**
   * Get a base key that can be used to generate consistent ids for the given
   * selector
   */
  private getBaseKey(
    selectorOrConfig: AtomSelectorOrConfig<any, any[]>,
    weak?: boolean
  ) {
    const existingId = this._refBaseKeys.get(selectorOrConfig)

    if (existingId || weak) return existingId

    const selectorName = this._getIdealCacheId(selectorOrConfig) || 'unnamed'

    const key = this.ecosystem._idGenerator.generateId(
      `@@selector-${selectorName}`
    )

    this._refBaseKeys.set(selectorOrConfig, key)

    return key
  }

  /**
   * Run an AtomSelector and, depending on the selector's resultsComparator,
   * update its cached result. Updates the graph efficiently (using
   * `.bufferUpdates()`)
   */
  private runSelector<T, Args extends any[]>(
    cache: SelectorCache<T, Args>,
    args: Args,
    isInitializing?: boolean,
    skipNotifyingDependents?: boolean
  ) {
    const { _evaluationStack, _graph, _mods, modBus } = this.ecosystem
    _graph.bufferUpdates(cache.id)

    const selector =
      typeof cache.selectorRef === 'function'
        ? cache.selectorRef
        : cache.selectorRef.selector

    const resultsComparator =
      (typeof cache.selectorRef !== 'function' &&
        cache.selectorRef.resultsComparator) ||
      defaultResultsComparator

    _evaluationStack.start(cache)

    try {
      const result = selector(_evaluationStack.atomGetters, ...args)

      if (!isInitializing && !resultsComparator(result, cache.result as T)) {
        if (!skipNotifyingDependents) {
          _graph.scheduleDependents(
            cache as SelectorCache,
            cache.nextReasons,
            result,
            cache.result
          )
        }

        if (_mods.stateChanged) {
          modBus.dispatch(
            pluginActions.stateChanged({
              cache: cache as SelectorCache,
              newState: result,
              oldState: cache.result,
              reasons: cache.nextReasons,
            })
          )
        }

        cache.result = result
      } else if (isInitializing) {
        cache.result = result

        if (_mods.statusChanged) {
          modBus.dispatch(
            pluginActions.statusChanged({
              newStatus: 'Active',
              node: cache as SelectorCache,
              oldStatus: 'Initializing',
            })
          )
        }
      }
    } catch (err) {
      _graph.destroyBuffer()
      console.error(
        `Zedux encountered an error while running selector with id "${cache.id}":`,
        err
      )

      throw err
    } finally {
      _evaluationStack.finish()
      cache.prevReasons = cache.nextReasons
      cache.nextReasons = []
    }

    _graph.flushUpdates()
  }
}
