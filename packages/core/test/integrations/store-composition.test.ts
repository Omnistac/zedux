import { createStore, zeduxTypes } from '@zedux/core/index'
import { createMockReducer } from '../utils'

describe('store composition', () => {
  test('parent store state reflects changes to the child store', () => {
    const parent = createStore()
    const child = createStore()
    const grandchild = createStore()

    grandchild.use(createMockReducer(1))

    parent.use({
      a: child,
    })

    expect(parent.getState()).toEqual({ a: undefined })
    expect(grandchild.getState()).toBe(1)

    child.use({
      b: grandchild,
    })

    expect(parent.getState()).toEqual({ a: { b: 1 } })
    expect(child.getState()).toEqual({ b: 1 })

    grandchild.use(createMockReducer(2))

    expect(parent.getState()).toEqual({ a: { b: 2 } })
    expect(child.getState()).toEqual({ b: 2 })
    expect(grandchild.getState()).toBe(2)
  })

  test('parent store subscribers are notified of state updates', () => {
    const parent = createStore()
    const child = createStore()
    const grandchild = createStore()

    parent.use(child.use(grandchild))

    const parentSubscriber = jest.fn()
    parent.subscribe(parentSubscriber)

    child.setState(() => 'a')

    const getExpectedAction = (payload: string) => ({
      metaData: [],
      metaType: zeduxTypes.delegate,
      payload: {
        payload,
        type: zeduxTypes.hydrate,
      },
    })

    expect(parentSubscriber).toHaveBeenLastCalledWith(
      'a',
      undefined,
      getExpectedAction('a')
    )
    expect(parentSubscriber).toHaveBeenCalledTimes(1)

    grandchild.setState(() => 'b')

    expect(parentSubscriber).toHaveBeenLastCalledWith('b', 'a', {
      metaData: [],
      metaType: zeduxTypes.delegate,
      payload: getExpectedAction('b'),
    })
    expect(parentSubscriber).toHaveBeenCalledTimes(2)

    parent.use(grandchild)

    expect(parentSubscriber).toHaveBeenCalledTimes(2)
  })

  test('parent store effect subscribers are notified of actions dispatched to or simulated in the child store', () => {
    const parent = createStore()
    const child = createStore()
    const grandchild = createStore()

    parent.use({
      a: child,
    })

    const parentEffectSubscriber = jest.fn()
    parent.subscribe({ effects: parentEffectSubscriber })

    child.setState(1)

    expect(parentEffectSubscriber).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: {
          metaType: zeduxTypes.delegate,
          metaData: ['a'],
          payload: {
            type: zeduxTypes.hydrate,
            payload: 1,
          },
        },
      })
    )

    child.use({
      b: grandchild,
    })

    expect(parentEffectSubscriber).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: {
          metaType: zeduxTypes.delegate,
          metaData: ['a'],
          payload: {
            type: zeduxTypes.prime,
          },
        },
      })
    )
  })

  test('delegates a delegate action to the child store', () => {
    const parent = createStore()
    const child = createStore()
    const grandchild = createStore()

    parent.use({
      a: child.use({
        b: grandchild.use({
          c: (state = 1, action) => action.payload || state,
        }),
        d: createMockReducer({}), // returns a new object every time; shouldn't be touched
      }),
      e: createMockReducer({}), // returns a new object every time; shouldn't be touched
    })

    const testAction = {
      metaType: zeduxTypes.delegate,
      metaData: ['a'],
      payload: {
        metaType: zeduxTypes.delegate,
        metaData: ['b'],
        payload: {
          type: 'f',
          payload: 2,
        },
      },
    }

    const prevState = parent.getState()
    const nextState = parent.dispatch(testAction)

    expect(prevState).not.toBe(nextState)
    expect(prevState.a).not.toBe(nextState.a)
    expect(prevState.a.b).not.toBe(nextState.a.b)

    expect(prevState.e).toBe(nextState.e)
    expect(prevState.a.d).toBe(nextState.a.d)

    expect(nextState).toEqual({
      a: {
        b: {
          c: 2,
        },
        d: {},
      },
      e: {},
    })
  })

  test('hydrating the parent hydrates the child', () => {
    const parent = createStore()
    const child = createStore()

    parent.use({
      a: {
        b: child.use({
          c: (state = 1) => state,
          d: {
            e: (state = 2) => state,
          },
        }),
      },
    })

    const initialState = parent.getState()

    parent.setState({
      a: {
        b: {
          ...initialState.a.b,
          c: 3,
        },
      },
    })

    const newState = parent.getState()

    expect(newState).toEqual({
      a: {
        b: {
          c: 3,
          d: {
            e: 2,
          },
        },
      },
    })

    expect(newState.a.b.d).toBe(initialState.a.b.d)
    expect(child.getState()).toEqual({
      c: 3,
      d: {
        e: 2,
      },
    })
  })

  test('setState() on the parent hydrates the child', () => {
    const parent = createStore()
    const child = createStore()

    parent.use({
      a: {
        b: child.use({
          c: (state = 1) => state,
          d: {
            e: (state = 2) => state,
          },
        }),
      },
    })

    const childEffectsSubscriber = jest.fn()
    child.subscribe({ effects: childEffectsSubscriber })

    parent.setState({
      a: {
        b: {
          c: 3,
        },
      },
    })

    const newParentState = parent.getState()
    const newChildState = child.getState()

    expect(newParentState).toEqual({
      a: {
        b: {
          c: 3,
          d: {
            e: 2,
          },
        },
      },
    })

    expect(newChildState).toEqual({
      c: 3,
      d: {
        e: 2,
      },
    })

    expect(childEffectsSubscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        action: {
          type: zeduxTypes.hydrate,
          payload: {
            c: 3,
          },
        },
      })
    )
  })

  test('child store can be integrated into a complex object', () => {
    const parent = createStore()
    const child = Object.create(createStore(null, 1), {
      a: { value: 2 },
    })

    parent.use({
      b: child,
    })

    expect(parent.getState()).toEqual({
      b: 1,
    })
  })

  test('composed stores wait until all stores in the hierarchy update before notifying subscribers', () => {
    const greatGrandchild111 = createStore(null, 'a')
    const grandchild11 = createStore({ greatGrandchild111 })
    const grandchild12 = createStore(null, 'b')
    const grandchild21 = createStore(null, 'c')
    const child1 = createStore({ grandchild11, grandchild12 })
    const child2 = createStore({ grandchild21 })
    const parent = createStore({ child1, child2 })

    const stores = {
      greatGrandchild111,
      grandchild11,
      grandchild12,
      grandchild21,
      child1,
      child2,
      parent,
    }

    const calls: string[] = []

    Object.entries(stores)
      // subscription order shouldn't matter:
      .sort(() => Math.random() - 0.5)
      .forEach(([name, store]) => {
        store.subscribe(() => calls.push(name))
      })

    child1.setState({
      grandchild11: {
        greatGrandchild111: 'aa',
      },
      grandchild12: 'bb',
    })

    expect(calls).toEqual([
      'greatGrandchild111',
      'grandchild11',
      'grandchild12',
      'child1',
      'parent',
    ])
  })
})
