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

  test('store -> observable of state (via Symbol.observable)', () => {
    const store = createStore(null, 'a')
    const state$ = from(store[Symbol.observable]())

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

  test('store -> observable of actions (via Symbol.observable)', () => {
    const store = createStore(null, 'a')
    const action$ = from(store.actionStream()[Symbol.observable]())

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

  test('store -> observable of actions with custom subscriber', () => {
    const store = createStore(null, 'a')
    const action$ = store.actionStream()[Symbol.observable]()

    const emissions: ActionChain[] = []
    const subscription = action$.subscribe(val => emissions.push(val))

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

  test('reducer errors emit error signals on action streams', () => {
    const reducer = (state: any, action: any) => {
      if (action.type === 'throw') throw 'a'

      return 'b'
    }

    const next = jest.fn()
    const error = jest.fn()

    const store = createStore(reducer)
    const action$ = store.actionStream()['@@observable']()
    const subscription = action$.subscribe({
      next,
      error,
    })
    const subscription2 = action$.subscribe({ error })

    store.dispatch({ type: 'no-throw' })
    try {
      store.dispatch({ type: 'throw' })
    } catch (err) {}

    subscription.unsubscribe()
    subscription2.unsubscribe()

    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith({ type: 'no-throw' })
    expect(error).toHaveBeenCalledTimes(2)
    expect(error).toHaveBeenLastCalledWith('a')
  })

  test('reducer errors emit nothing if no error subscriber is passed', () => {
    const reducer = (state: any) => {
      if (state) throw 'a'

      return 'b'
    }

    const next = jest.fn()

    const store = createStore(reducer)
    const action$ = store.actionStream()['@@observable']()
    const subscription = action$.subscribe({
      next,
    })

    try {
      store.dispatch({ type: 'test' })
    } catch (err) {}

    subscription.unsubscribe()

    expect(next).not.toHaveBeenCalled()
  })
})
