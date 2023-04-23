import { ActionFactoryPayloadType, Store, is } from '@zedux/core'
import {
  AnyAtomInstance,
  AnyAtomTemplate,
  AtomGetters,
  AtomParamsType,
  GraphEdgeInfo,
  Selectable,
} from '../types/index'
import { StackItem, Static } from '../utils/index'
import { pluginActions } from '../utils/plugin-actions'
import { Ecosystem } from './Ecosystem'
import { SelectorCache } from './Selectors'
import { AtomInstanceBase } from './instances/AtomInstanceBase'

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

  if (DEV && !is(item?.node, AtomInstanceBase)) {
    throw new Error('Zedux: Injectors can only be used in atom state factories')
  }

  return item.node as AnyAtomInstance
}

export const setStack = (newStack: StackItem[]) => (stack = newStack)

export class EvaluationStack {
  public atomGetters: AtomGetters

  constructor(private readonly ecosystem: Ecosystem) {
    const { _graph, selectors } = ecosystem

    const get: AtomGetters['get'] = ((atom, params) => {
      const { id, store } = ecosystem.getInstance(atom, params)

      // when called outside evaluation, get() is just an alias for
      // ecosystem.get()
      if (!stack.length) return store.getState()

      // if get is called during evaluation, track the required atom instances so
      // we can add graph edges for them
      _graph.addEdge(stack[stack.length - 1].node.id, id, 'get', 0)

      return store.getState()
    }) as AtomGetters['get']

    const getInstance: AtomGetters['getInstance'] = <A extends AnyAtomTemplate>(
      atom: A,
      params?: AtomParamsType<A>,
      edgeInfo?: GraphEdgeInfo
    ) => {
      const instance = ecosystem.getInstance(atom, params as AtomParamsType<A>)

      // when called outside evaluation, getInstance() is just an alias for
      // ecosystem.getInstance()
      if (!stack.length) return instance

      // if getInstance is called during evaluation, track the required atom
      // instances so we can add graph edges for them
      _graph.addEdge(
        stack[stack.length - 1].node.id,
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
      // when called outside evaluation, select() is just an alias for
      // ecosystem.select()
      if (!stack.length) {
        return ecosystem.select(selectable, ...args)
      }

      const cache = selectors.getCache(selectable, args)

      _graph.addEdge(stack[stack.length - 1].node.id, cache.id, 'select', 0)

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
    return stack.some(item => item.node.id === id)
  }

  public finish() {
    const item = stack.pop()
    const { _idGenerator, _mods, modBus } = this.ecosystem

    // if we just popped the last thing off the stack, restore the default
    // scheduler
    if (!stack.length) Store._scheduler = undefined

    if (!item || !_mods.evaluationFinished) return

    const time = item.start ? _idGenerator.now(true) - item.start : 0
    const action: ActionFactoryPayloadType<
      typeof pluginActions.evaluationFinished
    > = { node: item.node, time }

    modBus.dispatch(pluginActions.evaluationFinished(action))
  }

  public read(): StackItem | undefined {
    return stack[stack.length - 1]
  }

  public start(item: AnyAtomInstance | SelectorCache<any, any>) {
    const { _idGenerator, _mods, _scheduler } = this.ecosystem

    const newItem: StackItem = {
      node: item,
      start: _mods.evaluationFinished ? _idGenerator.now(true) : undefined,
    }

    stack.push(newItem)

    // all stores created during evaluation automatically belong to the ecosystem
    Store._scheduler = _scheduler
  }
}
