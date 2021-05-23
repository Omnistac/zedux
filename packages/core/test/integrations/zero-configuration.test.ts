import { actionTypes, createStore } from '@zedux/core/index'

describe('zero-configuration', () => {
  test('setState() can set the initial state of the store', () => {
    const store = createStore()
    const initialState = {
      a: {
        b: 1,
      },
    }

    const state = store.setState(initialState)

    expect(state).toBe(store.getState())
    expect(state).toBe(initialState)
  })

  test('setState() dispatches the special HYDRATE action to the store', () => {
    const effectSubscriber = jest.fn()
    const store = createStore(null, 1)

    store.subscribe({ effects: effectSubscriber })
    store.setState(2)

    expect(effectSubscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        action: {
          type: actionTypes.HYDRATE,
          payload: 2,
        },
      })
    )
  })

  test('inducers dispatch the special HYDRATE action to the store', () => {
    const effectSubscriber = jest.fn()
    const store = createStore(null, 1)

    store.subscribe({ effects: effectSubscriber })
    store.setState(() => 2)

    expect(effectSubscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        action: {
          type: actionTypes.HYDRATE,
          payload: 2,
        },
      })
    )
  })

  test('inducers fully replace the state', () => {
    const initialState = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3,
        },
      },
    }

    const store = createStore(null, initialState)

    const state = store.setState(state => ({
      a: 11,
      b: {
        ...state.b,
        c: 4,
      },
    }))

    expect(state).toEqual({
      a: 11,
      b: {
        c: 4,
        d: {
          e: 3,
        },
      },
    })

    expect(state.b.d).toBe(initialState.b.d)
  })
})
