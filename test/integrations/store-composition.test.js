import {
  actionTypes,
  createStore,
  effectTypes,
  metaTypes
} from '../../src/index'

import { getStoreBase } from '../utils'


describe('store composition', () => {

  test('parent store state reflects changes to the child store', () => {

    const parent = createStore()
    const child = createStore()
    const grandchild = createStore()

    parent.id = 'the parent'
    child.id = 'the child'
    grandchild.id = 'the grandchild'

    grandchild.use(() => 1)

    parent.use({
      a: child
    })

    expect(parent.getState()).toEqual({ a: undefined })
    expect(grandchild.getState()).toBe(1)

    child.use({
      b: grandchild
    })

    expect(parent.getState()).toEqual({ a: { b: 1 } })
    expect(child.getState()).toEqual({ b: 1 })

    grandchild.use(() => 2)

    expect(parent.getState()).toEqual({ a: { b: 2 }})
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

    child.dispatch(() => 'a')

    expect(parentSubscriber).toHaveBeenLastCalledWith('a', undefined)
    expect(parentSubscriber).toHaveBeenCalledTimes(1)

    grandchild.dispatch(() => 'b')

    expect(parentSubscriber).toHaveBeenLastCalledWith('b', 'a')
    expect(parentSubscriber).toHaveBeenCalledTimes(2)

    parent.use(grandchild)

    expect(parentSubscriber).toHaveBeenCalledTimes(2)

  })


  test('parent store effect subscribers are notified of actions dispatched to or simulated in the child store', () => {

    const parent = createStore()
    const child = createStore()
    const grandchild = createStore()

    const storeBase = getStoreBase(parent)

    parent.use({
      a: child
    })

    const parentEffectSubscriber = jest.fn()
    parent.subscribe({ effects: parentEffectSubscriber })

    child.hydrate(1)

    expect(parentEffectSubscriber).toHaveBeenLastCalledWith(expect.objectContaining({
      effects: [{
        metaType: metaTypes.DELEGATE,
        metaData: [ 'a' ],
        payload: {
          effectType: effectTypes.DISPATCH,
          payload: {
            type: actionTypes.HYDRATE,
            payload: 1
          }
        }
      }]
    }))

    child.use({
      b: grandchild
    })

    expect(parentEffectSubscriber).toHaveBeenLastCalledWith(expect.objectContaining({
      effects: [{
        metaType: metaTypes.DELEGATE,
        metaData: [ 'a' ],
        payload: {
          effectType: effectTypes.DISPATCH,
          payload: {
            type: actionTypes.RECALCULATE
          }
        }
      }]
    }))

  })


  test('delegates a DELEGATE action to the child store', () => {

    const parent = createStore()
    const child = createStore()
    const grandchild = createStore()

    parent.use({
      a: child.use({
        b: grandchild.use({
          c: (state = 1, action) => action.payload || state
        }),
        d: () => ({}) // returns a new object every time; shouldn't be touched
      }),
      e: () => ({}) // returns a new object every time; shouldn't be touched
    })

    const action = {
      metaType: metaTypes.DELEGATE,
      metaData: [ 'a' ],
      payload: {
        metaType: metaTypes.DELEGATE,
        metaData: [ 'b' ],
        payload: {
          type: 'f',
          payload: 2
        }
      }
    }

    const prevState = parent.getState()
    const { state } = parent.dispatch(action)

    expect(prevState).not.toBe(state)
    expect(prevState.a).not.toBe(state.a)
    expect(prevState.a.b).not.toBe(state.a.b)

    expect(prevState.e).toBe(state.e)
    expect(prevState.a.d).toBe(state.a.d)

    expect(state).toEqual({
      a: {
        b: {
          c: 2
        },
        d: {}
      },
      e: {}
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
            e: (state = 2) => state
          }
        })
      }
    })

    const initialState = parent.getState()

    parent.hydrate({
      a: {
        b: {
          ...initialState.a.b,
          c: 3
        }
      }
    })

    const newState = parent.getState()

    expect(newState).toEqual({
      a: {
        b: {
          c: 3,
          d: {
            e: 2
          }
        }
      }
    })

    expect(newState.a.b.d).toBe(initialState.a.b.d)
    expect(child.getState()).toEqual({
      c: 3,
      d: {
        e: 2
      }
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
            e: (state = 2) => state
          }
        })
      }
    })

    const childEffectsSubscriber = jest.fn()
    child.subscribe({ effects: childEffectsSubscriber })

    const initialParentState = parent.getState()
    const initialChildState = child.getState()

    parent.setState({
      a: {
        b: {
          c: 3
        }
      }
    })

    const newParentState = parent.getState()
    const newChildState = child.getState()

    expect(newParentState).toEqual({
      a: {
        b: {
          c: 3,
          d: {
            e: 2
          }
        }
      }
    })

    expect(newChildState).toEqual({
      c: 3,
      d: {
        e: 2
      }
    })

    expect(newParentState.a.b.d).toBe(initialParentState.a.b.d)
    expect(newChildState.d).toBe(initialChildState.d)

    expect(childEffectsSubscriber).toHaveBeenCalledWith(expect.objectContaining({
      effects: [{
        effectType: effectTypes.DISPATCH,
        payload: {
          type: actionTypes.HYDRATE,
          payload: {
            c: 3,
            d: {
              e: 2
            }
          }
        }
      }]
    }))

  })


  test('child store can be integrated into a complex object', () => {

    const parent = createStore()
    const child = Object.create(createStore().hydrate(1), {
      a: { value: 2 }
    })

    parent.use({
      b: child
    })

    expect(parent.getState()).toEqual({
      b: 1
    })

  })

})
