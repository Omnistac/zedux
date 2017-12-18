import { actionTypes, createStore, metaTypes } from '../../src/index'


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

    expect(parentSubscriber).toHaveBeenLastCalledWith(undefined, 'a')
    expect(parentSubscriber).toHaveBeenCalledTimes(1)

    grandchild.dispatch(() => 'b')

    expect(parentSubscriber).toHaveBeenLastCalledWith('a', 'b')
    expect(parentSubscriber).toHaveBeenCalledTimes(2)

    parent.use(grandchild)

    expect(parentSubscriber).toHaveBeenCalledTimes(2)

  })


  test('parent store inspectors are notified of actions dispatched to or simulated in the child store', () => {

    const storeBase = {
      dispatch: expect.any(Function),
      getState: expect.any(Function)
    }
    const parent = createStore()
    const child = createStore()
    const grandchild = createStore()

    parent.use({
      a: child
    })

    const parentInspector = jest.fn()
    parent.inspect(parentInspector)

    child.hydrate(1)

    expect(parentInspector).toHaveBeenLastCalledWith(storeBase, {
      metaType: metaTypes.DELEGATE,
      metaPayload: [ 'a' ],
      action: {
        type: actionTypes.HYDRATE,
        payload: 1
      }
    })

    child.use({
      b: grandchild
    })

    expect(parentInspector).toHaveBeenLastCalledWith(storeBase, {
      metaType: metaTypes.DELEGATE,
      metaPayload: [ 'a' ],
      action: {
        type: actionTypes.RECALCULATE
      }
    })

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
      metaPayload: [ 'a' ],
      action: {
        metaType: metaTypes.DELEGATE,
        metaPayload: [ 'b' ],
        action: {
          type: 'f',
          payload: 2
        }
      }
    }

    const prevState = parent.getState()
    const newState = parent.dispatch(action)

    expect(prevState).not.toBe(newState)
    expect(prevState.a).not.toBe(newState.a)
    expect(prevState.a.b).not.toBe(newState.a.b)

    expect(prevState.e).toBe(newState.e)
    expect(prevState.a.d).toBe(newState.a.d)

    expect(newState).toEqual({
      a: {
        b: {
          c: 2
        },
        d: {}
      },
      e: {}
    })

  })

})
