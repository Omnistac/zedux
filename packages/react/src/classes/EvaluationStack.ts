import {
  AtomGetters,
  AtomParamsType,
  AtomSelectorOrConfig,
  EdgeFlag,
  GraphEdgeInfo,
} from '../types'
import { AtomBase } from './atoms/AtomBase'
import { Ecosystem } from './Ecosystem'

export class EvaluationStack {
  public atomGetters: AtomGetters

  /**
   * A stack of AtomInstances and AtomSelectors that are currently evaluating -
   * innermost instance/selector (the one that's actually currently evaluating)
   * at the end of the array.
   */
  public stack: string[] = []

  constructor(private readonly ecosystem: Ecosystem) {
    const get: AtomGetters['get'] = ((atomOrInstance, params) => {
      const instance = ecosystem.getInstance(atomOrInstance, params)

      // when called outside AtomSelector evaluation, get() is just an alias for
      // ecosystem.get()
      if (!this.stack.length) return instance.store.getState()

      // if get is called during evaluation, track the required atom instances so
      // we can add graph edges for them
      ecosystem._graph.addEdge(
        this.stack[this.stack.length - 1],
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
      if (!this.stack.length) return instance

      // if getInstance is called during evaluation, track the required atom
      // instances so we can add graph edges for them
      ecosystem._graph.addEdge(
        this.stack[this.stack.length - 1],
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
      if (!this.stack.length) {
        return ecosystem.select(selectorOrConfig, ...args)
      }

      const cache = this.ecosystem.selectorCache.getCache(
        selectorOrConfig,
        args
      )

      ecosystem._graph.addEdge(
        this.stack[this.stack.length - 1],
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

  public isEvaluating(key: string) {
    return this.stack.includes(key)
  }
}
