import { actionTypes, createStore, effectTypes } from '../../src/index'


describe('zero-configuration', () => {

  test('setState() can set the initial state of the store (not what it\'s for)', () => {

    const store = createStore()
    const initialState = {
      a: {
        b: 1
      }
    }

    const { state } = store.setState(initialState)

    expect(state).toBe(store.getState())
    expect(state).toBe(initialState)

  })


  test('hydrate() dispatches the special HYDRATE action to the store', () => {

    const effectSubscriber = jest.fn()
    const store = createStore()

    store.subscribe({ effects: effectSubscriber })
    store.hydrate(1)

    expect(effectSubscriber).toHaveBeenCalledWith(expect.objectContaining({
      effects: [{
        effectType: effectTypes.DISPATCH,
        payload: {
          type: actionTypes.HYDRATE,
          payload: 1
        }
      }]
    }))

  })


  test('setState() dispatches the special PARTIAL_HYDRATE action to the store', () => {

    const effectSubscriber = jest.fn()
    const store = createStore()
      .hydrate(1)

    store.subscribe({ effects: effectSubscriber })
    store.setState(2)

    expect(effectSubscriber).toHaveBeenCalledWith(expect.objectContaining({
      effects: [{
        effectType: effectTypes.DISPATCH,
        payload: {
          type: actionTypes.PARTIAL_HYDRATE,
          payload: 2
        }
      }]
    }))

  })


  test('inducers dispatch the special PARTIAL_HYDRATE action to the store', () => {

    const effectSubscriber = jest.fn()
    const store = createStore()
      .hydrate(1)

    store.subscribe({ effects: effectSubscriber })
    store.dispatch(() => 2)

    expect(effectSubscriber).toHaveBeenCalledWith(expect.objectContaining({
      effects: [{
        effectType: effectTypes.DISPATCH,
        payload: {
          type: actionTypes.PARTIAL_HYDRATE,
          payload: 2
        }
      }]
    }))

  })


  test('inducers apply a partial update to the store', () => {

    const initialState = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3
        }
      }
    }

    const store = createStore()
      .hydrate(initialState)

    const { state } = store.dispatch(() => ({
      b: {
        c: 4
      }
    }))

    expect(state).toEqual({
      a: 1,
      b: {
        c: 4,
        d: {
          e: 3
        }
      }
    })

    expect(state.b.d).toBe(initialState.b.d)

  })

})
