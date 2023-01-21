import { ActionFactoryPayloadType } from '@zedux/core'
import {
  AnyAtomInstance,
  AtomGetters,
  AtomParamsType,
  EdgeFlag,
  GraphEdgeInfo,
  Selectable,
} from '../types'
import { InstanceStackItem, SelectorStackItem, StackItem } from '../utils'
import { AtomBase } from './atoms/AtomBase'
import { Ecosystem } from './Ecosystem'
import { AtomSelectorCache } from './SelectorCache'
import { ZeduxPlugin } from './ZeduxPlugin'

/**
 * A stack of AtomInstances and AtomSelectors that are currently evaluating -
 * innermost instance/selector (the one that's actually currently evaluating) at
 * the end of the array.
 *
 * This has to live in the module scope so `readInstance` can access it without
 * any ecosystem context. That's how injectors work.
 */
const stack: StackItem[] = []

export const readInstance = () => {
  const item = stack[stack.length - 1]

  if (DEV && !(item as InstanceStackItem | undefined)?.instance) {
    throw new Error('Zedux: Injectors can only be used in atom state factories')
  }

  return (item as InstanceStackItem).instance
}

export class EvaluationStack {
  public atomGetters: AtomGetters

  constructor(private readonly ecosystem: Ecosystem) {
    const get: AtomGetters['get'] = ((atomOrInstance, params) => {
      const instance = ecosystem.getInstance(atomOrInstance, params)

      // when called outside AtomSelector evaluation, get() is just an alias for
      // ecosystem.get()
      if (!stack.length) return instance.store.getState()

      // if get is called during evaluation, track the required atom instances so
      // we can add graph edges for them
      ecosystem._graph.addEdge(
        stack[stack.length - 1].key,
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
      if (!stack.length) return instance

      // if getInstance is called during evaluation, track the required atom
      // instances so we can add graph edges for them
      ecosystem._graph.addEdge(
        stack[stack.length - 1].key,
        instance.keyHash,
        edgeInfo?.[1] || 'getInstance',
        edgeInfo?.[0] ?? EdgeFlag.Static
      )

      return instance
    }

    const select: AtomGetters['select'] = <T = any, Args extends any[] = []>(
      selectable: Selectable<T, Args>,
      ...args: Args
    ) => {
      // when called outside AtomSelector evaluation, select() is just an alias for ecosystem.select()
      if (!stack.length) {
        return ecosystem.select(selectable, ...args)
      }

      const cache = this.ecosystem.selectorCache.getCache(selectable, args)

      ecosystem._graph.addEdge(
        stack[stack.length - 1].key,
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
    return stack.some(item => item.key === key)
  }

  public finish() {
    const item = stack.pop()
    if (!item || !this.ecosystem.mods.evaluationFinished) return

    const time = item.start ? performance.now() - item.start : 0
    const action = { time } as ActionFactoryPayloadType<
      typeof ZeduxPlugin.actions.evaluationFinished
    >

    if ((item as InstanceStackItem).instance) {
      ;(action as {
        instance: AnyAtomInstance
      }).instance = (item as InstanceStackItem).instance
    } else if ((item as SelectorStackItem).cache) {
      ;(action as {
        cache: AtomSelectorCache
      }).cache = (item as SelectorStackItem).cache
    }

    this.ecosystem.modsMessageBus.dispatch(
      ZeduxPlugin.actions.evaluationFinished(action as any)
    )
  }

  public read() {
    return stack[stack.length - 1]
  }

  public start(item: AnyAtomInstance | AtomSelectorCache<any, any>) {
    const newItem = {} as StackItem

    if ((item as AnyAtomInstance).keyHash) {
      newItem.key = (item as AnyAtomInstance).keyHash
      ;(newItem as InstanceStackItem).instance = item as AnyAtomInstance
    } else {
      newItem.key = (item as AtomSelectorCache).cacheKey
      ;(newItem as SelectorStackItem).cache = item as AtomSelectorCache
    }

    if (this.ecosystem.mods.evaluationFinished) {
      newItem.start = performance.now()
    }

    stack.push(newItem)
  }
}
