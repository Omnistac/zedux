import { actionTypes, createStore } from '../../src/index'
import { getStoreBase } from '../utils'


describe('zero-configuration', () => {

  test('setState() can set the initial state of the store (not what it\'s for)', () => {

    const store = createStore()
    const initialState = {
      a: {
        b: 1
      }
    }

    const newState = store.setState(initialState)

    expect(newState).toBe(store.getState())
    expect(newState).toBe(initialState)

  })


  test('hydrate() dispatches the special HYDRATE action to the store', () => {

    const inspector = jest.fn()
    const store = createStore()

    store.inspect(inspector)
    store.hydrate(1)

    expect(inspector).toHaveBeenCalledWith(getStoreBase(store), {
      type: actionTypes.HYDRATE,
      payload: 1
    })

  })


  test('setState() dispatches the special PARTIAL_HYDRATE action to the store', () => {

    const inspector = jest.fn()
    const store = createStore()
      .hydrate(1)

    store.inspect(inspector)
    store.setState(2)

    expect(inspector).toHaveBeenCalledWith(getStoreBase(store), {
      type: actionTypes.PARTIAL_HYDRATE,
      payload: 2
    })

  })


  test('inducers dispatch the special PARTIAL_HYDRATE action to the store', () => {

    const inspector = jest.fn()
    const store = createStore()
      .hydrate(1)

    store.inspect(inspector)
    store.dispatch(() => 2)

    expect(inspector).toHaveBeenCalledWith(getStoreBase(store), {
      type: actionTypes.PARTIAL_HYDRATE,
      payload: 2
    })

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

    const newState = store.dispatch(() => ({
      b: {
        c: 4
      }
    }))

    expect(newState).toEqual({
      a: 1,
      b: {
        c: 4,
        d: {
          e: 3
        }
      }
    })

    expect(newState.b.d).toBe(initialState.b.d)

  })

})
