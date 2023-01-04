import { ActionChain, actionTypes, createStore } from '@zedux/core'
import { from, map } from 'rxjs'

describe('rxjs integration', () => {
  test('store -> observable of state', () => {
    const store = createStore(null, 'a')
    const state$ = from(store)

    const emissions: string[] = []
    const subscription = state$.subscribe({ next: val => emissions.push(val) })

    store.setState('b')
    store.setState('c')
    subscription.unsubscribe()
    store.setState('d')

    expect(emissions).toEqual(['b', 'c'])
    expect((store as any)._subscribers.length).toBe(0)
  })

  test('store -> observable of actions', () => {
    const store = createStore(null, 'a')
    const action$ = from(store.actionStream())

    const emissions: ActionChain[] = []
    const subscription = action$.subscribe({ next: val => emissions.push(val) })

    store.setState('b')
    store.dispatch({ type: 'c', payload: 1 })
    subscription.unsubscribe()
    store.setState('d')

    expect(emissions).toEqual([
      { type: actionTypes.HYDRATE, payload: 'b' },
      { type: 'c', payload: 1 },
    ])
    expect((store as any)._subscribers.length).toBe(0)
  })

  test('merging a stream of state and actions', () => {
    const store = createStore(null, 'a')
    const action$ = from(store.actionStream())

    const emissions: [ActionChain, string][] = []
    const subscription = action$
      .pipe(map(action => [action, store.getState()] as [ActionChain, string]))
      .subscribe({ next: val => emissions.push(val) })

    store.setState('b')
    store.dispatch({ type: 'c', payload: 1 })
    subscription.unsubscribe()
    store.setState('d')

    expect(emissions).toEqual([
      [{ type: actionTypes.HYDRATE, payload: 'b' }, 'b'],
      [{ type: 'c', payload: 1 }, 'b'],
    ])
    expect((store as any)._subscribers.length).toBe(0)
  })
})
