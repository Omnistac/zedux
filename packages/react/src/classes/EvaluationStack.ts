import { ActionFactoryPayloadType, Store } from '@zedux/core'
import {
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomGetters,
  AtomParamsType,
  GraphEdgeInfo,
  Selectable,
} from '../types'
import {
  InstanceStackItem,
  SelectorStackItem,
  StackItem,
  Static,
} from '../utils'
import { pluginActions } from '../utils/plugin-actions'
import { Ecosystem } from './Ecosystem'
import { SelectorCache } from './Selectors'

const perf =
  typeof performance !== 'undefined' ? performance : { now: () => Date.now() }

/**
 * A stack of AtomInstances and AtomSelectors that are currently evaluating -
 * innermost instance/selector (the one that's actually currently evaluating) at
 * the end of the array.
 *
 * This has to live in the module scope so `readInstance` can access it without
 * any ecosystem context. That's how injectors work.
 */
export let stack: StackItem[] = []

export const readInstance = () => {
  const item = stack[stack.length - 1]

  if (DEV && !(item as InstanceStackItem | undefined)?.instance) {
    throw new Error('Zedux: Injectors can only be used in atom state factories')
  }

  return (item as InstanceStackItem).instance
}

export const setStack = (newStack: StackItem[]) => (stack = newStack)

export class EvaluationStack {
  public atomGetters: AtomGetters

  constructor(private readonly ecosystem: Ecosystem) {
    const get: AtomGetters['get'] = ((atom, params) => {
      const instance = ecosystem.getInstance(atom, params)

      // when called outside AtomSelector evaluation, get() is just an alias for
      // ecosystem.get()
      if (!stack.length) return instance.store.getState()

      // if get is called during evaluation, track the required atom instances so
      // we can add graph edges for them
      ecosystem._graph.addEdge(
        stack[stack.length - 1].id,
        instance.id,
        'get',
        0
      )

      return instance.store.getState()
    }) as AtomGetters['get']

    const getInstance: AtomGetters['getInstance'] = <A extends AnyAtomTemplate>(
      atom: A,
      params?: AtomParamsType<A>,
      edgeInfo?: GraphEdgeInfo
    ) => {
      const instance = ecosystem.getInstance(atom, params as AtomParamsType<A>)

      // when called outside AtomSelector evaluation, getInstance() is just an alias
      // for ecosystem.getInstance()
      if (!stack.length) return instance

      // if getInstance is called during evaluation, track the required atom
      // instances so we can add graph edges for them
      ecosystem._graph.addEdge(
        stack[stack.length - 1].id,
        instance.id,
        edgeInfo?.[1] || 'getInstance',
        edgeInfo?.[0] ?? Static
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

      const cache = this.ecosystem.selectors.getCache(selectable, args)

      ecosystem._graph.addEdge(
        stack[stack.length - 1].id,
        cache.id,
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

  public isEvaluating(id: string) {
    return stack.some(item => item.id === id)
  }

  public finish() {
    const item = stack.pop()
    Store._scheduler = undefined

    if (!item || !this.ecosystem._mods.evaluationFinished) return

    const time = item.start ? perf.now() - item.start : 0
    const action = { time } as ActionFactoryPayloadType<
      typeof pluginActions.evaluationFinished
    >

    if ((item as InstanceStackItem).instance) {
      ;(
        action as {
          instance: AnyAtomInstance
        }
      ).instance = (item as InstanceStackItem).instance
    } else if ((item as SelectorStackItem).cache) {
      ;(
        action as {
          cache: SelectorCache
        }
      ).cache = (item as SelectorStackItem).cache
    }

    this.ecosystem.modBus.dispatch(
      pluginActions.evaluationFinished(action as any)
    )
  }

  public read() {
    return stack[stack.length - 1]
  }

  public start(item: AnyAtomInstance | SelectorCache<any, any>) {
    const newItem = {} as StackItem

    if ((item as AnyAtomInstance).id) {
      newItem.id = (item as AnyAtomInstance).id
      ;(newItem as InstanceStackItem).instance = item as AnyAtomInstance
    } else {
      newItem.id = (item as SelectorCache).id
      ;(newItem as SelectorStackItem).cache = item as SelectorCache
    }

    if (this.ecosystem._mods.evaluationFinished) {
      newItem.start = perf.now()
    }

    stack.push(newItem)

    // all stores created during evaluation automatically belong to the ecosystem
    Store._scheduler = this.ecosystem._scheduler
  }
}
